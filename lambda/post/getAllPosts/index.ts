import {
  APIGatewayProxyEvent,
  Context,
  APIGatewayProxyResult,
} from "aws-lambda";
import { AssumeRoleCommand, STSClient } from "@aws-sdk/client-sts";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  TranslateConfig,
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

export const getAllPostsLambdaDir = __dirname;

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log(`Event: ${JSON.stringify(event, null, 2)}`);
  console.log(`Context: ${JSON.stringify(context, null, 2)}`);

  try {
    const assumedRoleARN = process.env.CREATE_POST_ROLE;
    const dynamodbTableName = process.env.DYNAMODB_TABLE_NAME;

    const { Authorization } = event.headers;
    const userId = Authorization!.split(" ")[1];

    const { ownerId } = event.queryStringParameters!;

    const sts = new STSClient({});
    const session = await sts.send(
      new AssumeRoleCommand({
        RoleArn: assumedRoleARN,
        RoleSessionName: "TempSessionName",
        DurationSeconds: 900,
        Tags: [
          {
            Key: "userId",
            Value: userId,
          },
        ],
      })
    );

    const translateConfig: TranslateConfig = {
      marshallOptions: {
        convertEmptyValues: false,
        removeUndefinedValues: false,
        convertClassInstanceToMap: false,
      },
      unmarshallOptions: {
        wrapNumbers: false,
      },
    };

    const dynamoDb = DynamoDBDocumentClient.from(
      new DynamoDBClient({
        credentials: {
          accessKeyId: session.Credentials?.AccessKeyId!,
          secretAccessKey: session.Credentials?.SecretAccessKey!,
          sessionToken: session.Credentials?.SessionToken,
        },
      }),
      translateConfig
    );

    const result = await dynamoDb.send(
      new QueryCommand({
        TableName: dynamodbTableName,
        IndexName: "gsi1",
        KeyConditionExpression: "#pk2 = :pk2v AND #sk2 = :sk2v",
        ExpressionAttributeNames: {
          "#pk2": "partKey2",
          "#sk2": "sortKey2",
        },
        ExpressionAttributeValues: {
          ":pk2v": `user/${ownerId}`,
          ":sk2v": "post",
        },
      })
    );

    return { statusCode: 200, body: JSON.stringify({ ...result }) };
  } catch (error) {
    console.error((error as Error).message);

    return {
      statusCode: 403,
      body: JSON.stringify({
        error: (error as Error).message,
        h: event.headers,
      }),
    };
  }
};
