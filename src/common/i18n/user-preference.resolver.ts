import { Injectable, ExecutionContext } from '@nestjs/common';
import { I18nResolver } from 'nestjs-i18n';

@Injectable()
export class UserPreferenceResolver implements I18nResolver {
    async resolve(context: ExecutionContext): Promise<string | string[] | undefined> {
        const req = context.switchToHttp().getRequest();

        // If user is authenticated, check their preferences
        if (req.user && req.user.preferences && req.user.preferences.language) {
            return req.user.preferences.language;
        }

        return undefined;
    }
}
