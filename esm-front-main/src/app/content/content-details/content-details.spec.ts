import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentDetails } from './content-details';

describe('ContentDetails', () => {
  let component: ContentDetails;
  let fixture: ComponentFixture<ContentDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContentDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
