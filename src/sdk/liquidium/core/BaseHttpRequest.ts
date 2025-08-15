/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiRequestOptions } from '@/sdk/liquidium/core/ApiRequestOptions';
import type { CancelablePromise } from '@/sdk/liquidium/core/CancelablePromise';
import type { OpenAPIConfig } from '@/sdk/liquidium/core/OpenAPI';

export abstract class BaseHttpRequest {

    constructor(public readonly config: OpenAPIConfig) {}

    public abstract request<T>(options: ApiRequestOptions): CancelablePromise<T>;
}
