import { aws_iam as iam, aws_lambda as lambda } from "aws-cdk-lib";
import { Construct } from "constructs";
import RoleAssumingLambda from "./RoleAssumingLambda";

export interface TenantIsolatedDynamoDBLambdaProps
  extends lambda.FunctionProps {
  assumedRoleArnEnvKey: string;
  partitionKeyPrefix: string;
  dynamodbAction: string;
  dynamodbTableArn: string;
}

export default class TenantIsolatedDynamoDBLambda extends RoleAssumingLambda {
  constructor(
    scope: Construct,
    id: string,
    props: TenantIsolatedDynamoDBLambdaProps
  ) {
    const {
      assumedRoleArnEnvKey,
      partitionKeyPrefix,
      dynamodbAction,
      dynamodbTableArn,
      ...rest
    } = props;

    const assumedRolePolicyStatements: iam.PolicyStatement[] = [
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [dynamodbAction],
        resources: [dynamodbTableArn],
        conditions: {
          "ForAllValues:StringLike": {
            "dynamodb:LeadingKeys": [
              `\${aws:PrincipalTag/${partitionKeyPrefix}}`,
            ],
          },
        },
      }),
    ];

    super(scope, id, {
      ...rest,
      assumedRolePolicyStatements,
      assumedRoleArnEnvKey: assumedRoleArnEnvKey,
      sessionTags: [partitionKeyPrefix],
    });
  }
}
