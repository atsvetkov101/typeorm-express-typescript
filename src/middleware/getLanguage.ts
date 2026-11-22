import { Request, Response, NextFunction } from 'express';

import { Language } from '../orm/entities/users/types';

const DEFAULT_LANGUAGE: Language = 'en-US';

const isLanguage = (value: string): value is Language => value === 'en-US' || value === 'sl-SI';

const normalizeLanguage = (acceptLanguageHeader: string | null): Language => {
  if (!acceptLanguageHeader) {
    return DEFAULT_LANGUAGE;
  }

  const [primaryLanguage] = acceptLanguageHeader.split(',');
  const language = primaryLanguage.trim();

  if (isLanguage(language)) {
    return language;
  }

  const [languageCode] = language.split('-');

  if (languageCode.toLowerCase() === 'sl') {
    return 'sl-SI';
  }

  return DEFAULT_LANGUAGE;
};

export const getLanguage = (req: Request, res: Response, next: NextFunction) => {
  req.language = normalizeLanguage(req.get('Accept-Language'));
  return next();
};
