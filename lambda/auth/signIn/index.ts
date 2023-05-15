import {
  APIGatewayProxyEvent,
  Context,
  APIGatewayProxyResult,
} from "aws-lambda";
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";

export const signInLambdaDir = __dirname;

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
      data: { email, password },
    } = JSON.parse(event.body!);

    const result = await client.send(
      new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: userPoolClientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
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
