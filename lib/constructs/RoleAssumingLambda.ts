import { aws_iam as iam, aws_lambda as lambda } from "aws-cdk-lib";
import { Construct } from "constructs";

export interface RoleAssumingLambdaProps extends lambda.FunctionProps {
  assumedRolePolicyStatements: iam.PolicyStatement[];
  assumedRoleArnEnvKey: string;
  sessionTags?: string[];
}

export default class RoleAssumingLambda extends lambda.Function {
  public readonly props: RoleAssumingLambdaProps;
  public lambdaAssumedRole: iam.Role;

  constructor(scope: Construct, id: string, props: RoleAssumingLambdaProps) {
    super(scope, id, props);
    this.props = props;

    this.lambdaAssumedRole = new iam.Role(this, `${id}AssumingRole`, {
      assumedBy: this._getLambdaPrincipal(),
    });

    this.props.assumedRolePolicyStatements.forEach(
      (assumedRolePolicyStatement) =>
        this.lambdaAssumedRole.addToPolicy(assumedRolePolicyStatement)
    );

    this.addEnvironment(
      props.assumedRoleArnEnvKey,
      this.lambdaAssumedRole.roleArn
    );
  }

  private _getLambdaPrincipal(): iam.IPrincipal {
    const lambdaPrincipal = new iam.ArnPrincipal(this.role?.roleArn!);

    if (this.props.sessionTags) {
      const StringLike: { [key: string]: "*" } = {};
      this.props.sessionTags.forEach((tag) => {
        StringLike[`aws:RequestTag/${tag}`] = "*";
      });

      const taggableLambdaPrincipal = new iam.SessionTagsPrincipal(
        lambdaPrincipal.withConditions({
          StringLike,
        })
      );

      return taggableLambdaPrincipal;
    }

    return lambdaPrincipal;
  }

  public getAssumedRole() {
    return this.lambdaAssumedRole;
  }
}
