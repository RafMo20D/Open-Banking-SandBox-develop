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

/* eslint-disable @typescript-eslint/no-empty-function */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NgHttpLoaderModule } from 'ng-http-loader';
import { of } from 'rxjs';

import { AppComponent } from './app.component';
import { CustomizeService } from './services/customize.service';
import { AccountComponent } from './components/account/account.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { InfoModule } from './commons/info/info.module';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let customizeService: CustomizeService;

  const CustomizeServiceStub = {
    isCustom: () => false,
    setUserTheme: () => {},
    getJSON: () => {
      return of({
        globalSettings: {
          logo: '../assets/UI/Logo_XS2ASandbox.png',
          cssVariables: {
            colorPrimary: '#054f72',
            fontFamily: 'Arial, sans-serif',
            headerBG: '#ffffff',
            headerFontColor: '#000000',
          },
        },
      });
    },
    getLogo: () => '../assets/UI/Logo_XS2ASandbox.png',
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([{ path: 'accounts', component: AccountComponent }]),
        ReactiveFormsModule,
        HttpClientTestingModule,
        InfoModule,
        FormsModule,
      ],
      schemas: [ CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [NgHttpLoaderModule, RouterTestingModule],
      declarations: [AppComponent],
      providers: [{ provide: CustomizeService, useValue: CustomizeServiceStub }],
      schemas: [ CUSTOM_ELEMENTS_SCHEMA],
    })
      .compileComponents()
      .then(() => {
        customizeService = TestBed.inject(CustomizeService);
      });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set global settings in ngOnInit', () => {
    const getGlobalSettingsSpy = spyOn(customizeService, 'getJSON').and.callThrough();

    component.ngOnInit();

    expect(getGlobalSettingsSpy).toHaveBeenCalled();
    expect(component.globalSettings).not.toBeUndefined();
  });
});
