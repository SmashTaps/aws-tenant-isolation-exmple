import {
  aws_apigateway as apiGateway,
  aws_lambda as lambda,
} from "aws-cdk-lib";

import { Construct } from "constructs";

export interface CrudApiProps extends apiGateway.RestApiProps {
  authorizer?: apiGateway.IAuthorizer;
}

export interface CreateCrudProps {
  endpointNoun: { singular: string; plural?: string };
  integrations: {
    get?: lambda.Function;
    getAll?: lambda.Function;
    post?: lambda.Function;
    put?: lambda.Function;
    delete?: lambda.Function;
  };
  pickResource?: (
    root: apiGateway.IResource
  ) => apiGateway.IResource | undefined;
}

export default class CrudApi extends apiGateway.RestApi {
  private props: CrudApiProps;
  public readonly restApi: apiGateway.RestApi;

  constructor(scope: Construct, id: string, props: CrudApiProps) {
    super(scope, id, props);
    this.props = props;
    this.restApi = new apiGateway.RestApi(scope, "CrudAPI");
  }

  public createCrud(props: CreateCrudProps): {
    singularResource: apiGateway.IResource;
    pluralResource: apiGateway.IResource | undefined;
  } {
    let resource: apiGateway.IResource;
    if (props.pickResource && props.pickResource(this.restApi.root)) {
      resource = props.pickResource(this.restApi.root)!;
    } else {
      resource = this.restApi.root;
    }

    let singularResource = resource.getResource(props.endpointNoun.singular);
    if (!singularResource) {
      singularResource = resource.addResource(props.endpointNoun.singular);
    }

    let pluralResource;
    if (props.endpointNoun.plural) {
      pluralResource = resource.getResource(props.endpointNoun.plural);
      if (!pluralResource) {
        pluralResource = resource.addResource(props.endpointNoun.plural);
      }
    }

    if (
      Object.values(props.integrations).every((integration) => !integration)
    ) {
      throw new Error("At least a one integration is required");
    }

    this._initResource({
      resource,
      method: "GET",
      resourceName: props.endpointNoun.singular,
      integration: props.integrations.get,
    });

    if (props.endpointNoun.plural) {
      this._initResource({
        resource,
        method: "GET",
        resourceName: props.endpointNoun.plural,
        integration: props.integrations.getAll,
      });
    }

    this._initResource({
      resource,
      method: "PUT",
      resourceName: props.endpointNoun.singular,
      integration: props.integrations.put,
    });

    this._initResource({
      resource,
      method: "POST",
      resourceName: props.endpointNoun.singular,
      integration: props.integrations.post,
    });

    this._initResource({
      resource,
      method: "DELETE",
      resourceName: props.endpointNoun.singular,
      integration: props.integrations.delete,
    });

    return { singularResource, pluralResource };
  }

  private _initResource(props: {
    resource: apiGateway.IResource;
    resourceName: string;
    method: string;
    integration?: lambda.Function;
  }) {
    if (props.integration) {
      const resource = props.resource.getResource(props.resourceName)!;
      if (this.props.authorizer) {
        resource.addMethod(
          props.method,
          new apiGateway.LambdaIntegration(props.integration),
          { authorizer: this.props.authorizer }
        );
      } else {
        resource.addMethod(
          props.method,
          new apiGateway.LambdaIntegration(props.integration)
        );
      }
    }
  }
}
