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

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AccountService } from '../../services/account.service';
import { CashDepositComponent } from './cash-deposit.component';

describe('CashDepositComponent', () => {
  let component: CashDepositComponent;
  let fixture: ComponentFixture<CashDepositComponent>;
  let accountService: AccountService;
  let router: Router;
  let activate: ActivatedRoute;

  const mockRouter = {
    navigate: (url: string) => {
      console.log('mocknavigation', url);
    },
  };
  const mockActivatedRoute = {
    snapshot: { paramMap: convertToParamMap({ id: '12345' }) },
    params: of({ id: '12345' }),
  };

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [ReactiveFormsModule, HttpClientTestingModule],
        providers: [
          AccountService,
          { provide: Router, useValue: mockRouter },
          { provide: ActivatedRoute, useValue: mockActivatedRoute },
        ],
        declarations: [CashDepositComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(CashDepositComponent);
    component = fixture.componentInstance;
    accountService = TestBed.inject(AccountService);
    router = TestBed.inject(Router);
    activate = TestBed.inject(ActivatedRoute);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the accounts on ngOnInit', () => {
    const spyRoute = spyOn(activate.snapshot.paramMap, 'get');
    spyRoute.and.returnValue('id');
    component.cashDepositForm.setValue({
      currency: 'EUR',
      amount: '50',
    });
    const accountSpy = spyOn(accountService, 'getAccount').and.returnValue(
      of<any>({
        data: component.cashDepositForm.controls['currency'].setValue('EUR'),
      })
    );
    component.ngOnInit();

    expect(spyRoute).toHaveBeenCalled();
    expect(accountSpy).toHaveBeenCalled();
  });

  it('should deposit cash when cashDepositForm is valid and submitted', () => {
    expect(component.submitted).toBeFalsy();
    component.onSubmit();
    expect(component.cashDepositForm.invalid).toBeTruthy();

    // set valid values for cashDepositForm
    component.cashDepositForm.controls['currency'].setValue('EUR');
    component.cashDepositForm.controls['amount'].setValue('50');

    // cashDepositForm submit
    const sampleResponse = { value: 'sample response' };
    const depositCashSpy = spyOn(
      accountService,
      'depositCash'
    ).and.callFake(() => of(sampleResponse));
    const navigateSpy = spyOn(router, 'navigate');
    component.onSubmit();
    expect(component.submitted).toBeTruthy();
    expect(component.cashDepositForm.valid).toBeTruthy();
    expect(depositCashSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/accounts/12345']);
  });

  it('should throw error onSubmit', () => {
    const depositCashSpy = spyOn(accountService, 'depositCash').and.returnValue(
      throwError({ status: 404 })
    );

    // set valid values for cashDepositForm
    component.cashDepositForm.controls['currency'].setValue('EUR');
    component.cashDepositForm.controls['amount'].setValue('50');
    component.onSubmit();
    expect(depositCashSpy).toHaveBeenCalled();
    expect(component.errorMessage).toBeTruthy();
  });
});
