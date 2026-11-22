import 'mocha';
import { expect } from 'chai';
import { Request, Response, NextFunction } from 'express';

import { getLanguage } from './getLanguage';

describe('getLanguage middleware', () => {
  const runGetLanguage = (acceptLanguage?: string) => {
    const request = {
      get: (header: string) => (header === 'Accept-Language' ? acceptLanguage : undefined),
    } as unknown as Request;
    const response = {} as unknown as Response;
    let isNextCalled = false;
    const next: NextFunction = () => {
      isNextCalled = true;
    };

    getLanguage(request, response, next);

    return { request, isNextCalled };
  };

  it('should fall back to en-US without Accept-Language', () => {
    const { request, isNextCalled } = runGetLanguage();

    expect(request.language).to.equal('en-US');
    expect(isNextCalled).to.equal(true);
  });

  it('should keep a supported language', () => {
    const { request } = runGetLanguage('sl-SI');

    expect(request.language).to.equal('sl-SI');
  });

  it('should normalize a base language code', () => {
    expect(runGetLanguage('en').request.language).to.equal('en-US');
    expect(runGetLanguage('sl').request.language).to.equal('sl-SI');
  });

  it('should use the first language from the header', () => {
    const { request } = runGetLanguage('sl-SI,en-US;q=0.9');

    expect(request.language).to.equal('sl-SI');
  });

  it('should fall back to en-US for unsupported languages', () => {
    expect(runGetLanguage('de-DE').request.language).to.equal('en-US');
    expect(runGetLanguage('').request.language).to.equal('en-US');
  });
});
