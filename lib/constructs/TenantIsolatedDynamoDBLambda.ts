import { aws_iam as iam, aws_lambda as lambda } from "aws-cdk-lib";
import { Construct } from "constructs";
import RoleAssumingLambda from "./RoleAssumingLambda";

export interface TenantIsolatedDynamoDBLambdaProps
  extends Omit<lambda.FunctionProps, "runtime" | "handler" | "code"> {
  lambdaDirectory: string;
  assumedRoleArnEnvKey: string;
  dynamodbSettings: {
    tableName: string;
    tableArn: string;
    action: string;
    allowedAttributes?: string[];
  };
  tenantIdentifier: string;
  getPartitionKeyPattern: (tenantIdentifierSessionTag: string) => string;
}

export default class TenantIsolatedDynamoDBLambda extends RoleAssumingLambda {
  constructor(
    scope: Construct,
    id: string,
    props: TenantIsolatedDynamoDBLambdaProps
  ) {
    const {
      lambdaDirectory,
      assumedRoleArnEnvKey,
      dynamodbSettings: { tableName, action, tableArn, allowedAttributes },
      tenantIdentifier,
      getPartitionKeyPattern,
      ...rest
    } = props;

    const policyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [action],
      resources: [tableArn],
      conditions: {
        "ForAllValues:StringLike": {
          "dynamodb:LeadingKeys": [
            getPartitionKeyPattern(`\${aws:PrincipalTag/${tenantIdentifier}}`),
          ],
        },
      },
    });

    if (allowedAttributes && allowedAttributes.length > 0) {
      policyStatement.addCondition("ForAllValues:StringEquals", {
        "dynamodb:Attributes": allowedAttributes,
      });
    }

    super(scope, id, {
      ...rest,
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(lambdaDirectory),
      assumedRolePolicyStatements: [policyStatement],
      assumedRoleArnEnvKey: assumedRoleArnEnvKey,
      sessionTags: [tenantIdentifier],
    });

    this.addEnvironment("DYNAMODB_TABLE_NAME", tableName);
  }
}
