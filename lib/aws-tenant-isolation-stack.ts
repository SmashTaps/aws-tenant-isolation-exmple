import {
  aws_apigateway as apiGateway,
  aws_dynamodb as dynamodb,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_s3 as s3,
  custom_resources as cr,
  RemovalPolicy,
  Stack,
  aws_cognito as cognito,
} from "aws-cdk-lib";
import { Construct } from "constructs";

import CrudApi from "./constructs/CrudApi";
import TenantIsolatedDynamoDBLambda from "./constructs/TenantIsolatedDynamoDBLambda";

import { createPostLambdaDir } from "../lambda/post/createPost";
import { getPostByIdLambdaDir } from "../lambda/post/getPostById";
import { getAllPostsLambdaDir } from "../lambda/post/getAllPosts";
import { updatePostLambdaDir } from "../lambda/post/updatePost";
import { deletePostLambdaDir } from "../lambda/post/deletePost";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { AccountRecovery, CfnUserPoolGroup } from "aws-cdk-lib/aws-cognito";
import { signUpLambdaDir } from "../lambda/auth/signUp";
import { verifyEmailLambdaDir } from "../lambda/auth/verifyEmail";
import { requestEmailVerificationLambdaDir } from "../lambda/auth/requestEmailVerification";

export class AwsTenantIsolationStack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const dynamodbTable = new dynamodb.Table(this, "XYZ-TABLE", {
      partitionKey: {
        name: "partKey1",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "sortKey1",
        type: dynamodb.AttributeType.STRING,
      },
    });
    dynamodbTable.applyRemovalPolicy(RemovalPolicy.DESTROY);
    dynamodbTable.addGlobalSecondaryIndex({
      indexName: "gsi1",
      partitionKey: {
        name: "partKey2",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "sortKey2",
        type: dynamodb.AttributeType.STRING,
      },
    });

    // const s3Bucket = new s3.Bucket(this, constants.S3_BUCKET_NAME, {
    //   bucketName: constants.S3_BUCKET_NAME,
    //   blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    // });
    // s3Bucket.applyRemovalPolicy(RemovalPolicy.DESTROY);

    const auth = new cognito.UserPool(this, "XYZ-Auth", {
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      selfSignUpEnabled: true,
      autoVerify: { email: true },
      signInAliases: { email: true },
    });
    const authClient = new cognito.UserPoolClient(this, "XYZ-Auth-client", {
      userPool: auth,
      authFlows: { userPassword: true },
    });

    const adminUserGroup = new CfnUserPoolGroup(this, "AdminUserGroup", {
      userPoolId: auth.userPoolId,
      groupName: "admin",
    });
    const employeeUserGroup = new CfnUserPoolGroup(this, "EmployeeUserGroup", {
      userPoolId: auth.userPoolId,
      groupName: "employee",
    });
    const hrUserGroup = new CfnUserPoolGroup(this, "HRUserGroup", {
      userPoolId: auth.userPoolId,
      groupName: "hr",
    });

    const userSignUpLambda = new lambda.Function(this, "SignUpLambda", {
      code: lambda.Code.fromAsset(signUpLambdaDir),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_16_X,
      environment: {
        USER_POOL_ID: auth.userPoolId,
        USER_POOL_CLIENT_ID: authClient.userPoolClientId,
      },
    });
    auth.grant(
      userSignUpLambda,
      "cognito:SignUp",
      "cognito-idp:AdminAddUserToGroup"
    );

    const userSignInLambda = new lambda.Function(this, "SignInLambda", {
      code: lambda.Code.fromAsset(signUpLambdaDir),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_16_X,
      environment: {
        USER_POOL_CLIENT_ID: authClient.userPoolClientId,
      },
    });
    auth.grant(userSignInLambda, "cognito:InitiateAuth");

    const userVerifyEmailLambda = new lambda.Function(
      this,
      "VerifyEmailLambda",
      {
        code: lambda.Code.fromAsset(verifyEmailLambdaDir),
        handler: "index.handler",
        runtime: lambda.Runtime.NODEJS_16_X,
        environment: {
          USER_POOL_CLIENT_ID: authClient.userPoolClientId,
        },
      }
    );
    auth.grant(userVerifyEmailLambda, "cognito:ConfirmSignUpCommand");

    const userRequestEmailVerificationLambda = new lambda.Function(
      this,
      "RequestEmailVerificationLambda",
      {
        code: lambda.Code.fromAsset(requestEmailVerificationLambdaDir),
        handler: "index.handler",
        runtime: lambda.Runtime.NODEJS_16_X,
        environment: {
          USER_POOL_CLIENT_ID: authClient.userPoolClientId,
        },
      }
    );
    auth.grant(
      userRequestEmailVerificationLambda,
      "cognito:ResendConfirmationCode"
    );

    const dynamodbPostCollectionSettings = {
      tableName: dynamodbTable.tableName,
      tableArn: dynamodbTable.tableArn,
      allowedAttributes: [
        "partKey1",
        "sortKey1",
        "postId",
        "postTitle",
        "postContent",
        "partKey2",
        "sortKey2",
      ],
    };

    const createPostLambda = new TenantIsolatedDynamoDBLambda(
      this,
      "CreatePostLambda",
      {
        lambdaDirectory: createPostLambdaDir,
        assumedRoleArnEnvKey: "CREATE_POST_ROLE",
        dynamodbSettings: {
          ...dynamodbPostCollectionSettings,
          action: "dynamodb:PutItem",
        },
        tenantIdentifier: "userId",
        getPartitionKeyPattern: (tenantIdentifierSessionTag) =>
          `user/${tenantIdentifierSessionTag}`,
      }
    );

    const getPostByIdLambda = new TenantIsolatedDynamoDBLambda(
      this,
      "GetPostByIdLambda",
      {
        lambdaDirectory: getPostByIdLambdaDir,
        assumedRoleArnEnvKey: "GET_POST_BY_ID_ROLE",
        dynamodbSettings: {
          ...dynamodbPostCollectionSettings,
          action: "dynamodb:GetItem",
        },
        tenantIdentifier: "userId",
        getPartitionKeyPattern: (tenantIdentifierSessionTag) =>
          `user/${tenantIdentifierSessionTag}`,
      }
    );

    const getAllPostsLambda = new TenantIsolatedDynamoDBLambda(
      this,
      "GetAllPostsLambda",
      {
        lambdaDirectory: getAllPostsLambdaDir,
        assumedRoleArnEnvKey: "GET_ALL_POSTS_ROLE",
        dynamodbSettings: {
          ...dynamodbPostCollectionSettings,
          action: "dynamodb:Query",
        },
        tenantIdentifier: "userId",
        getPartitionKeyPattern: (tenantIdentifierSessionTag) =>
          `user/${tenantIdentifierSessionTag}`,
      }
    );

    const updatePostLambda = new TenantIsolatedDynamoDBLambda(
      this,
      "UpdatePostLambda",
      {
        lambdaDirectory: updatePostLambdaDir,
        assumedRoleArnEnvKey: "UPDATE_POST_ROLE",
        dynamodbSettings: {
          ...dynamodbPostCollectionSettings,
          action: "dynamodb:UpdateItem",
        },
        tenantIdentifier: "userId",
        getPartitionKeyPattern: (tenantIdentifierSessionTag) =>
          `user/${tenantIdentifierSessionTag}`,
      }
    );

    const deletePostLambda = new TenantIsolatedDynamoDBLambda(
      this,
      "DeletePostLambda",
      {
        lambdaDirectory: deletePostLambdaDir,
        assumedRoleArnEnvKey: "DELETE_POST_ROLE",
        dynamodbSettings: {
          ...dynamodbPostCollectionSettings,
          action: "dynamodb:DeleteItem",
        },
        tenantIdentifier: "userId",
        getPartitionKeyPattern: (tenantIdentifierSessionTag) =>
          `user/${tenantIdentifierSessionTag}`,
      }
    );

    const crudApi = new CrudApi(this, "XYZ-API", {
      authorizer: new apiGateway.CognitoUserPoolsAuthorizer(this, "CUA", {
        cognitoUserPools: [auth],
      }),
    });

    const authResource = crudApi.root.addResource("auth");
    authResource
      .addResource("signUp")
      .addMethod("POST", new apiGateway.LambdaIntegration(userSignUpLambda));

    authResource
      .addResource("signIn")
      .addMethod("POST", new apiGateway.LambdaIntegration(userSignInLambda));

    authResource
      .addResource("verifyEmail")
      .addMethod(
        "POST",
        new apiGateway.LambdaIntegration(userVerifyEmailLambda)
      );

    authResource
      .addResource("requestEmailVerification")
      .addMethod(
        "POST",
        new apiGateway.LambdaIntegration(userRequestEmailVerificationLambda)
      );

    crudApi.createCrud({
      endpointNoun: {
        singular: "post",
        plural: "posts",
      },
      integrations: {
        getAll: getAllPostsLambda,
        post: createPostLambda,
      },
    });

    // crudApi.createCrud({
    //   endpointNoun: {
    //     singular: "{postId}",
    //   },
    //   integrations: {
    //     get: getPostByIdLambda,
    //     put: updatePostLambda,
    //     delete: deletePostLambda,
    //   },
    //   pickResource: (root) => root.getResource("post"),
    // });

    // crudApi.createCrud({
    //   endpointNoun: {
    //     singular: "comment",
    //     plural: "comments",
    //   },
    //   integrations: {
    //     // getAll: ,
    //     // post: ,
    //   },
    //   pickResource: (root) => root.getResource("post")?.getResource("{postId}"),
    // });

    // crudApi.createCrud({
    //   endpointNoun: {
    //     singular: "{commentId}",
    //   },
    //   integrations: {
    //     // get: ,
    //     // put: ,
    //     // delete: ,
    //   },
    //   pickResource: (root) =>
    //     root
    //       .getResource("post")
    //       ?.getResource("{postId}")
    //       ?.getResource("comment"),
    // });
  }
}
