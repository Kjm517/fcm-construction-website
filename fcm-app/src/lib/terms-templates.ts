export type TermsTemplate = 'template1' | 'template2';

export interface TermsTemplateData {
  terms: string[];
  includeProposal: boolean;
  proposalText?: string;
}

export const getTermsTemplate = (template: TermsTemplate, totalFormatted: string): TermsTemplateData => {
  switch (template) {
    case 'template1':
      return {
        terms: [
          "Customers will be billed after 30 days upon completion and turnover of work with 7 days warranty",
          "Please email the signed price quote to the address above.",
          "Any additional work shall be created with a new quotation.",
          "If there is any request for a contract bond or any expenses that are out of the price quotation, FCM Trading and Services will not be included in this quotation.",
        ],
        includeProposal: true,
      };
    
    case 'template2':
      return {
        terms: [
          "50% Down payment will be collected upon contract signing.",
          "Full payment will be collected upon Project acceptance.",
          "Any additional work shall be created with a new quotation.",
        ],
        includeProposal: true,
        proposalText: `FCM Trading and Services proposes to furnish the items described and specified herein the above-mentioned buyers who accept and bind themselves to the specifications of the materials herein offered, terms and conditions of the proposal, for the sum of`,
      };
    
    default:
      return getTermsTemplate('template1', totalFormatted);
  }
};

