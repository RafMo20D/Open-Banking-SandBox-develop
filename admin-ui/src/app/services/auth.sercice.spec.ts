/*
 * Copyright 2018-2023 adorsys GmbH & Co KG
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or (at
 * your option) any later version. This program is distributed in the hope that
 * it will be useful, but WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 *
 * This project is also available under a separate commercial license. You can
 * contact us at psd2@adorsys.com.
 */

import { inject, TestBed } from '@angular/core/testing';
import { JwtHelperService } from '@auth0/angular-jwt';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { TppInfo } from '../models/tpp-info.model';
import { UserService } from './user.service';

describe('AuthService', () => {
  let httpTestingController: HttpTestingController;
  let authService: AuthService;
  let userService: UserService;
  let router: Router;
  const url = `${environment.tppAdminBackend}`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule],
      providers: [AuthService, JwtHelperService, UserService],
    });

    httpTestingController = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    userService = TestBed.inject(UserService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', inject([AuthService], (service: AuthService) => {
    expect(service).toBeTruthy();
  }));

  it('should delete token on logout', () => {
    const navigateSpy = spyOn(router, 'navigate').and.callFake(() =>
      Promise.resolve(true)
    );
    authService.logout();

    expect(sessionStorage.getItem('token')).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/logout']);
  });

  it('should call authorize when login', () => {
    const getAuthorizationTokenSpy = spyOn(
      authService,
      'authorize'
    ).and.callThrough();
    const credentialsMock = { login: 's', pin: 'q' };
    authService.login(credentialsMock);
    expect(getAuthorizationTokenSpy).toHaveBeenCalled();
  });

  it('should test login method', () => {
    // isLoggedin() is false by default
    sessionStorage.setItem('access_token', null);
    expect(authService.isLoggedIn()).toBeFalsy();

    // login credential is not correct
    const credentialsMock = { login: 'q', pin: 'q' };
    authService.login(credentialsMock).subscribe((response) => {
      console.log(response);
      expect(response).toBeFalsy();
    });

    const req = httpTestingController.expectOne(url + '/login');
    expect(req.cancelled).toBeFalsy();
    expect(req.request.method).toEqual('POST');
    req.flush(credentialsMock);
  });

  it('should test register method', () => {
    // login credential is not correct
    const credentialsMock = {
      email: 'test@test.de',
      login: 'test',
      id: '12345678',
      pin: '123456',
    };

    authService
      .register(credentialsMock as TppInfo, 'DE')
      .subscribe((response) => {
        expect(response.email).toBe('test@test.de');
      });

    const req = httpTestingController.expectOne(url + '/register');
    expect(req.cancelled).toBeFalsy();
    expect(req.request.method).toEqual('POST');
    req.flush(credentialsMock);
  });

  it('should return expected list of users (HttpClient called once)', () => {
    const mockUsers = [
      {
        accountAccesses: [
          {
            id: 'bNrPhmm3SC0vwm2Tf4KknM',
            iban: 'DE51250400903312345678',
            accessType: 'OWNER',
          },
          {
            id: 'lcyeJaTxQrIhtuNQl-kF4E',
            iban: 'ME66929958485327905358',
            accessType: 'OWNER',
          },
        ],
        branch: 'fdf',
        email: 'foo@foo.de',
        id: 'J4tdJUEPQhglZAFgvo9aJc',
        login: 'test',
        pin: '$2a$10$hi7Cd4j9gd/ZBw7w.kbNVOzDNUgIEXUtG5ZJYvjjTGLjUwOR0qibu',
        scaUserData: [
          {
            id: 'HeJDea8LQE8rdLiJ6eKfhY',
            scaMethod: 'SMTP_OTP',
            methodValue: 'foo@fool.de',
          },
        ],
        userRoles: ['CUSTOMER'],
      },
    ];

    userService.listUsers().subscribe();

    const req = httpTestingController.expectOne(
      url + '/users?page=0&size=25&queryParam='
    );
    expect(req.cancelled).toBeFalsy();
    expect(req.request.responseType).toEqual('json');
    expect(req.request.method).toEqual('GET');

    req.flush(mockUsers);
  });
});
