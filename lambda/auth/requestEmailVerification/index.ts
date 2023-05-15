import {
  APIGatewayProxyEvent,
  Context,
  APIGatewayProxyResult,
} from "aws-lambda";
import {
  CognitoIdentityProviderClient,
  ResendConfirmationCodeCommand,
} from "@aws-sdk/client-cognito-identity-provider";

export const requestEmailVerificationLambdaDir = __dirname;

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log(`Event: ${JSON.stringify(event, null, 2)}`);
  console.log(`Context: ${JSON.stringify(context, null, 2)}`);

  try {
    const client = new CognitoIdentityProviderClient({});

    const userPoolClientId = process.env.USER_POOL_CLIENT_ID;

    const {
      data: { email, confirmationCode },
    } = JSON.parse(event.body!);

    const result = await client.send(
      new ResendConfirmationCodeCommand({
        ClientId: userPoolClientId,
        Username: email,
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ ...result }),
    };
  } catch (error) {
    console.error((error as Error).message);

    return {
      statusCode: 403,
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
};
