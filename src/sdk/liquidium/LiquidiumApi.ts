/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseHttpRequest } from '@/sdk/liquidium/core/BaseHttpRequest';
import type { OpenAPIConfig } from '@/sdk/liquidium/core/OpenAPI';
import { FetchHttpRequest } from '@/sdk/liquidium/core/FetchHttpRequest';
import { AuthenticationService } from '@/sdk/liquidium/services/AuthenticationService';
import { BorrowerService } from '@/sdk/liquidium/services/BorrowerService';
import { PortfolioService } from '@/sdk/liquidium/services/PortfolioService';
import { RepayLoanService } from '@/sdk/liquidium/services/RepayLoanService';
import { StartLoanService } from '@/sdk/liquidium/services/StartLoanService';
type HttpRequestConstructor = new (config: OpenAPIConfig) => BaseHttpRequest;
export class LiquidiumApi {
    public readonly authentication: AuthenticationService;
    public readonly borrower: BorrowerService;
    public readonly portfolio: PortfolioService;
    public readonly repayLoan: RepayLoanService;
    public readonly startLoan: StartLoanService;
    public readonly request: BaseHttpRequest;
    constructor(config?: Partial<OpenAPIConfig>, HttpRequest: HttpRequestConstructor = FetchHttpRequest) {
        this.request = new HttpRequest({
            BASE: config?.BASE ?? '',
            VERSION: config?.VERSION ?? '0.0.1',
            WITH_CREDENTIALS: config?.WITH_CREDENTIALS ?? false,
            CREDENTIALS: config?.CREDENTIALS ?? 'include',
            TOKEN: config?.TOKEN,
            USERNAME: config?.USERNAME,
            PASSWORD: config?.PASSWORD,
            HEADERS: config?.HEADERS,
            ENCODE_PATH: config?.ENCODE_PATH,
        });
        this.authentication = new AuthenticationService(this.request);
        this.borrower = new BorrowerService(this.request);
        this.portfolio = new PortfolioService(this.request);
        this.repayLoan = new RepayLoanService(this.request);
        this.startLoan = new StartLoanService(this.request);
    }
}

