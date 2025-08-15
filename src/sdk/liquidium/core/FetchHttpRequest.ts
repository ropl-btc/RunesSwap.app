/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiRequestOptions } from '@/sdk/liquidium/core/ApiRequestOptions';
import { BaseHttpRequest } from '@/sdk/liquidium/core/BaseHttpRequest';
import type { CancelablePromise } from '@/sdk/liquidium/core/CancelablePromise';
import type { OpenAPIConfig } from '@/sdk/liquidium/core/OpenAPI';
import { request as __request } from '@/sdk/liquidium/core/request';

export class FetchHttpRequest extends BaseHttpRequest {

    constructor(config: OpenAPIConfig) {
        super(config);
    }

    /**
     * Request method
     * @param options The request options from the service
     * @returns CancelablePromise<T>
     * @throws ApiError
     */
    public override request<T>(options: ApiRequestOptions): CancelablePromise<T> {
        return __request(this.config, options);
    }
}
