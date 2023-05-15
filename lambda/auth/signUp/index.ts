import {
  APIGatewayProxyEvent,
  Context,
  APIGatewayProxyResult,
} from "aws-lambda";
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  AdminAddUserToGroupCommand,
} from "@aws-sdk/client-cognito-identity-provider";

export const signUpLambdaDir = __dirname;

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log(`Event: ${JSON.stringify(event, null, 2)}`);
  console.log(`Context: ${JSON.stringify(context, null, 2)}`);

  try {
    const client = new CognitoIdentityProviderClient({});

    const userPoolId = process.env.USER_POOL_ID;
    const userPoolClientId = process.env.USER_POOL_CLIENT_ID;

    const {
      data: { email, password },
    } = JSON.parse(event.body!);

    const signUpResult = await client.send(
      new SignUpCommand({
        ClientId: userPoolClientId,
        Username: email,
        Password: password,
      })
    );

    const userGroupingResult = await client.send(
      new AdminAddUserToGroupCommand({
        UserPoolId: userPoolId,
        Username: email,
        GroupName: "admin",
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ ...signUpResult, ...userGroupingResult }),
    };
  } catch (error) {
    console.error((error as Error).message);

    return {
      statusCode: 403,
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
};
