import { inject } from "@angular/core";
import { HttpInterceptorFn } from "@angular/common/http";
import { from, switchMap } from "rxjs";
import { environment } from "../../environments/environment";
import { AuthService } from "./auth.service";

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);

  if (!request.url.startsWith(environment.apiBaseUrl)) {
    return next(request);
  }

  return from(auth.getAccessToken()).pipe(
    switchMap((token) =>
      next(
        token
          ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
          : request,
      ),
    ),
  );
};
