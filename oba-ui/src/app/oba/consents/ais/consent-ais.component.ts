import { Component, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { debounceTime, map, tap } from 'rxjs/operators';
import { ObaAisConsent } from '../../../api/models/oba-ais-consent';
import { OnlineBankingService } from '../../../common/services/online-banking.service';
import { InfoService } from '../../../common/info/info.service';
import { OnlineBankingConsentsService } from '../../../api/services/online-banking-consents.service';

@Component({
  selector: 'app-consent-ais',
  templateUrl: './consent-ais.component.html',
  styleUrls: ['./consent-ais.component.scss'],
})
export class ConsentAisComponent implements OnInit {
  formModel: UntypedFormGroup;
  consents: ObaAisConsent[] = [];
  config: {
    itemsPerPage: number;
    currentPage: number;
    totalItems: number;
    maxSize: number;
  } = {
    itemsPerPage: 10,
    currentPage: 1,
    totalItems: 0,
    maxSize: 7,
  };

  constructor(
    private activatedRoute: ActivatedRoute,
    private onlineBankingService: OnlineBankingService,
    private fb: UntypedFormBuilder,
    private infoService: InfoService
  ) {}

  ngOnInit() {
    this.formModel = this.fb.group({
      itemsPerPage: [this.config.itemsPerPage, Validators.required],
    });
    this.getConsentsPaged(this.config.currentPage, this.config.itemsPerPage);
    this.activatedRoute.params.pipe(map((resp) => resp.id)).subscribe(() => {
      this.refreshConsents();
    });
    this.onQueryConsents();
  }

  onQueryConsents() {
    this.formModel.valueChanges
      .pipe(
        tap((val) => {
          this.formModel.patchValue(val, { emitEvent: false });
        }),
        debounceTime(750)
      )
      .subscribe((form) => {
        this.config.itemsPerPage = form.itemsPerPage;
        this.getConsentsPaged(1, this.config.itemsPerPage);
      });
  }

  refreshConsents() {
    this.getConsentsPaged(this.config.currentPage, this.config.itemsPerPage);
  }

  pageChange(pageNumber: number) {
    this.config.currentPage = pageNumber;
    this.getConsentsPaged(pageNumber, this.config.itemsPerPage);
  }

  getConsentsPaged(page: number, size: number) {
    const params = {
      page: page - 1,
      size,
    } as OnlineBankingConsentsService.PagedUsingGetParams;
    this.onlineBankingService.getConsentsPaged(params).subscribe((response) => {
      this.consents = response.content;
      this.config.totalItems = response.totalElements;
    });
  }

  isConsentEnabled(consent: ObaAisConsent) {
    return (
      consent.aisAccountConsent.consentStatus === 'VALID' ||
      consent.aisAccountConsent.consentStatus === 'RECEIVED'
    );
  }

  copiedConsentSuccessful() {
    this.infoService.openFeedback('copied encrypted consent to clipboard', {
      severity: 'info',
    });
  }

  revokeConsent(consent: ObaAisConsent) {
    if (!this.isConsentEnabled(consent)) {
      return false;
    }
    this.onlineBankingService
      .revokeConsent(consent.aisAccountConsent.id)
      .subscribe((isSuccess) => {
        if (isSuccess) {
          this.getConsentsPaged(
            this.config.currentPage,
            this.config.itemsPerPage
          );
        } else {
          this.infoService.openFeedback('could not revoke the consent', {
            severity: 'error',
          });
        }
      });
  }
}
