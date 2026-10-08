import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('AuthService password recovery', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [AuthService, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests a reset link using the entered email', () => {
    service.requestPasswordReset('owner@example.com').subscribe();

    const request = http.expectOne('http://localhost:8080/api/auth/password-reset/request');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'owner@example.com' });
    request.flush(null, { status: 202, statusText: 'Accepted' });
  });

  it('submits the one-time token and new password', () => {
    service.completePasswordReset('single-use-token', 'a-new-long-password').subscribe();

    const request = http.expectOne('http://localhost:8080/api/auth/password-reset/complete');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      token: 'single-use-token',
      password: 'a-new-long-password'
    });
    request.flush(null, { status: 204, statusText: 'No Content' });
  });
});
