import {
  APIGatewayProxyEvent,
  Context,
  APIGatewayProxyResult,
} from "aws-lambda";
import { AssumeRoleCommand, STSClient } from "@aws-sdk/client-sts";
import {
  DynamoDBDocumentClient,
  PutCommand,
  TranslateConfig,
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

export const deletePostLambdaDir = __dirname;

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log(`Event: ${JSON.stringify(event, null, 2)}`);
  console.log(`Context: ${JSON.stringify(context, null, 2)}`);

  try {
    const assumedRoleARN = process.env.CREATE_POST_ROLE;
    const dynamodbTableName = process.env.DYNAMODB_TABLE_NAME;

    const {
      auth: { userId },
      data,
    } = JSON.parse(event.body!);

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
      new PutCommand({
        TableName: dynamodbTableName,
        Item: data,
        ConditionExpression: `attribute_not_exists(partKey1)`,
      })
    );

    return { statusCode: 200, body: JSON.stringify({ ...result }) };
  } catch (error) {
    console.error((error as Error).message);

    return {
      statusCode: 403,
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
};
