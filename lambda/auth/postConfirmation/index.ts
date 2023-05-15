import {
  PostConfirmationTriggerEvent,
  Context,
  APIGatewayProxyResult,
} from "aws-lambda";
import {
  DynamoDBDocumentClient,
  PutCommand,
  TranslateConfig,
} from "@aws-sdk/lib-dynamodb";
import { AssumeRoleCommand, STSClient } from "@aws-sdk/client-sts";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

export const postConfirmationLambdaDir = __dirname;

export const handler = async (
  event: PostConfirmationTriggerEvent,
  context: Context
): Promise<PostConfirmationTriggerEvent> => {
  console.log(`Event: ${JSON.stringify(event, null, 2)}`);
  console.log(`Context: ${JSON.stringify(context, null, 2)}`);

  try {
    const assumedRoleARN = process.env.USER_POST_CONFIRMATION_ROLE;
    const dynamodbTableName = process.env.DYNAMODB_TABLE_NAME;

    // const sts = new STSClient({});
    // const session = await sts.send(
    //   new AssumeRoleCommand({
    //     RoleArn: assumedRoleARN,
    //     RoleSessionName: "TempSessionName",
    //     DurationSeconds: 900,
    //     Tags: [
    //       {
    //         Key: "companyId",
    //         Value: userId,
    //       },
    //     ],
    //   })
    // );

    // const translateConfig: TranslateConfig = {
    //   marshallOptions: {
    //     convertEmptyValues: false,
    //     removeUndefinedValues: false,
    //     convertClassInstanceToMap: false,
    //   },
    //   unmarshallOptions: {
    //     wrapNumbers: false,
    //   },
    // };

    // const dynamoDb = DynamoDBDocumentClient.from(
    //   new DynamoDBClient({
    //     credentials: {
    //       accessKeyId: session.Credentials?.AccessKeyId!,
    //       secretAccessKey: session.Credentials?.SecretAccessKey!,
    //       sessionToken: session.Credentials?.SessionToken,
    //     },
    //   }),
    //   translateConfig
    // );

    // const result = await dynamoDb.send(
    //   new PutCommand({
    //     TableName: dynamodbTableName,
    //     Item: {},
    //     ConditionExpression: `attribute_not_exists(partKey1)`,
    //   })
    // );
  } catch (error) {
    console.error((error as Error).message);
  } finally {
    return event;
  }
};
