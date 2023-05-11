import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ResendConfirmationCodeCommand,
  ConfirmSignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({
  credentials: {
    accessKeyId: "AKIAUUGJ2MJ5LRG7E7HJ",
    secretAccessKey: "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",
  },
});

const initiateAuth = async (username: string, password: string) => {
  const params = {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: "4ttgk8q6a06rguc5evuhf80l9u",
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
    },
  };

  try {
    const { AuthenticationResult } = await client.send(
      new InitiateAuthCommand(params)
    );
    return AuthenticationResult;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const authenticateUser = async () => {
  const username = "thedath@smashtaps.com";
  const password = "Abcde@12345";

  const result = await initiateAuth(username, password);

  if (result) {
    console.log("Authentication successful!");
    console.log(result);
  } else {
    console.log("Authentication failed.");
  }
};
// authenticateUser();

const signUp = async () => {
  try {
    const result = await client.send(
      new SignUpCommand({
        ClientId: "4ttgk8q6a06rguc5evuhf80l9u",
        Username: "thedath@smashtaps.com",
        Password: "Abcde@12345",
      })
    );
    console.log({ result });
  } catch (error) {
    console.error({ error });
  }
};
// signUp();

const requestConfirmation = async () => {
  try {
    const result = await client.send(
      new ResendConfirmationCodeCommand({
        ClientId: "4ttgk8q6a06rguc5evuhf80l9u",
        Username: "thedath@smashtaps.com",
      })
    );
    console.log({ result });
  } catch (error) {
    console.error({ error });
  }
};
requestConfirmation();

const confirmConformation = async () => {
  try {
    const result = await client.send(
      new ConfirmSignUpCommand({
        ClientId: "4ttgk8q6a06rguc5evuhf80l9u",
        Username: "thedath@smashtaps.com",
        ConfirmationCode: "",
      })
    );
    console.log({ result });
  } catch (error) {
    console.error({ error });
  }
};
// confirmConformation();
