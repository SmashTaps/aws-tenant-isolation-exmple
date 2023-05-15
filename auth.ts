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

const authenticateUser = async () => {
  try {
    const result = await client.send(
      new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: "1bg7qsiqpb1r6rnvohjge1t8kk",
        AuthParameters: {
          USERNAME: "thedath@smashtaps.com",
          PASSWORD: "Abcde@12345",
        },
      })
    );
    console.log({ result });
  } catch (error) {
    console.error({ error });
  }
};
authenticateUser();

const signUp = async () => {
  try {
    const result = await client.send(
      new SignUpCommand({
        ClientId: "1bg7qsiqpb1r6rnvohjge1t8kk",
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
        ClientId: "1bg7qsiqpb1r6rnvohjge1t8kk",
        Username: "thedath@smashtaps.com",
      })
    );
    console.log({ result });
  } catch (error) {
    console.error({ error });
  }
};
// requestConfirmation();

const confirmConformation = async () => {
  try {
    const result = await client.send(
      new ConfirmSignUpCommand({
        ClientId: "1bg7qsiqpb1r6rnvohjge1t8kk",
        Username: "thedath@smashtaps.com",
        ConfirmationCode: "844762",
      })
    );
    console.log({ result });
  } catch (error) {
    console.error({ error });
  }
};
// confirmConformation();
