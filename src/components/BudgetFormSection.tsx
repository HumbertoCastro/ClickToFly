import { ArrowLeft, ArrowRight, CheckCircle2, Send } from 'lucide-react';
import { type ChangeEvent, type FormEvent, useMemo, useState } from 'react';
import type { BudgetFormValues } from '../types';
import { CheckboxGroup, DateField, InputField, SelectField, TextareaField } from './FormFields';
import { SectionHeader } from './SectionHeader';

const initialValues: BudgetFormValues = {
  name: '',
  phone: '',
  email: '',
  origin: '',
  destination: '',
  departureDate: '',
  returnDate: '',
  adults: '1',
  children: '0',
  checkedBag: '',
  flexibleDates: '',
  services: [],
  notes: '',
};

const steps = ['Contato', 'Roteiro', 'Preferências', 'Revisão'];
const serviceOptions = ['Hospedagem', 'Transporte', 'Passeios', 'Seguro viagem'];

type ErrorMap = Partial<Record<keyof BudgetFormValues, string>>;

type BudgetFormSectionProps = {
  variant?: 'landing' | 'page';
};

export function BudgetFormSection({ variant = 'landing' }: BudgetFormSectionProps) {
  const [values, setValues] = useState<BudgetFormValues>(initialValues);
  const [activeStep, setActiveStep] = useState(0);
  const [errors, setErrors] = useState<ErrorMap>({});
  const [submitted, setSubmitted] = useState(false);

  const summaryItems = useMemo(
    () => [
      ['Nome', values.name],
      ['Celular', values.phone],
      ['E-mail', values.email],
      ['Origem', values.origin],
      ['Destino', values.destination],
      ['Ida', values.departureDate],
      ['Volta', values.returnDate],
      ['Adultos', values.adults],
      ['Crianças', values.children],
      ['Bagagem', values.checkedBag],
      ['Flexibilidade', values.flexibleDates],
      ['Serviços', values.services.length ? values.services.join(', ') : 'Nenhum adicional selecionado'],
    ],
    [values],
  );
  const destinationSummary = values.destination || 'Destino ainda não definido';
  const dateSummary =
    values.departureDate || values.returnDate
      ? `${values.departureDate || 'Ida'} até ${values.returnDate || 'volta'}`
      : 'Datas a definir';
  const travelersSummary = `${values.adults} adulto(s), ${values.children} criança(s)`;
  const servicesSummary = values.services.length ? values.services.join(', ') : 'Serviços adicionais opcionais';

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const validateStep = () => {
    const nextErrors: ErrorMap = {};

    if (activeStep === 0) {
      if (!values.name.trim()) nextErrors.name = 'Informe seu nome completo.';
      if (!values.phone.trim()) nextErrors.phone = 'Informe um celular para contato.';
      if (!values.email.trim()) nextErrors.email = 'Informe seu e-mail.';
    }

    if (activeStep === 1) {
      if (!values.origin.trim()) nextErrors.origin = 'Informe a origem.';
      if (!values.destination.trim()) nextErrors.destination = 'Informe o destino.';
      if (!values.departureDate) nextErrors.departureDate = 'Escolha a data de ida.';
      if (!values.returnDate) nextErrors.returnDate = 'Escolha a data de volta.';
    }

    if (activeStep === 2) {
      if (!values.checkedBag) nextErrors.checkedBag = 'Selecione uma opção.';
      if (!values.flexibleDates) nextErrors.flexibleDates = 'Selecione uma opção.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goNext = () => {
    if (!validateStep()) return;
    setActiveStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const goBack = () => {
    setActiveStep((current) => Math.max(current - 1, 0));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (activeStep < steps.length - 1) {
      goNext();
      return;
    }

    setSubmitted(true);
  };

  return (
    <section className={`budget-section section-pad ${variant === 'page' ? 'budget-section-page' : ''}`} id="orcamento">
      <div className="container">
        <SectionHeader
          eyebrow="Orçamento personalizado"
          title="Monte um pacote com atendimento consultivo"
          description="Responda um pré-planejamento rápido para nossa equipe buscar opções alinhadas ao seu destino, datas, perfil de viagem e orçamento."
        />

        <div className="budget-card reveal">
          {submitted ? (
            <div className="success-message" role="status">
              <CheckCircle2 />
              <h3>Recebemos seu pré-planejamento.</h3>
              <p>
                A equipe Click To Fly entrará em contato para buscar as melhores opções para sua
                viagem.
              </p>
            </div>
          ) : (
            <div className="budget-product">
              <form className="budget-form" onSubmit={handleSubmit} noValidate>
                <div className="stepper" aria-label="Etapas do formulário">
                  {steps.map((step, index) => (
                    <span key={step} className={index <= activeStep ? 'is-active' : ''}>
                      <em>{index + 1}</em>
                      {step}
                    </span>
                  ))}
                </div>

                {activeStep === 0 ? (
                  <div className="form-grid">
                    <InputField label="Nome completo" name="name" value={values.name} required error={errors.name} onChange={handleChange} />
                    <InputField label="Celular" name="phone" value={values.phone} required error={errors.phone} onChange={handleChange} placeholder="(00) 00000-0000" />
                    <InputField label="E-mail" name="email" value={values.email} type="email" required error={errors.email} onChange={handleChange} />
                  </div>
                ) : null}

                {activeStep === 1 ? (
                  <div className="form-grid">
                    <InputField label="Origem" name="origin" value={values.origin} required error={errors.origin} onChange={handleChange} placeholder="Cidade ou aeroporto" />
                    <InputField label="Destino" name="destination" value={values.destination} required error={errors.destination} onChange={handleChange} placeholder="Cidade, país ou aeroporto" />
                    <DateField label="Data de ida" name="departureDate" value={values.departureDate} required error={errors.departureDate} onChange={handleChange} />
                    <DateField label="Data de volta" name="returnDate" value={values.returnDate} required error={errors.returnDate} onChange={handleChange} />
                    <SelectField label="Adultos" name="adults" value={values.adults} onChange={handleChange} required options={['1', '2', '3', '4', '5+']} />
                    <SelectField label="Crianças" name="children" value={values.children} onChange={handleChange} required options={['0', '1', '2', '3', '4+']} />
                  </div>
                ) : null}

                {activeStep === 2 ? (
                  <div className="form-grid">
                    <SelectField
                      label="Bagagem despachada"
                      name="checkedBag"
                      value={values.checkedBag}
                      required
                      error={errors.checkedBag}
                      onChange={handleChange}
                      options={['Sim', 'Não', 'Ainda não sei']}
                    />
                    <SelectField
                      label="Possui flexibilidade de datas próximas?"
                      name="flexibleDates"
                      value={values.flexibleDates}
                      required
                      error={errors.flexibleDates}
                      onChange={handleChange}
                      options={['Sim', 'Não', 'Talvez']}
                    />
                    <CheckboxGroup
                      label="Serviços adicionais"
                      options={serviceOptions}
                      value={values.services}
                      onChange={(services) => setValues((current) => ({ ...current, services }))}
                    />
                    <TextareaField
                      label="Observação"
                      name="notes"
                      value={values.notes}
                      onChange={handleChange}
                      placeholder="Conte preferências de horário, companhia, conexões, datas alternativas ou objetivo da viagem."
                    />
                  </div>
                ) : null}

                {activeStep === 3 ? (
                  <div className="review-grid">
                    {summaryItems.map(([label, value]) => (
                      <div key={label}>
                        <span>{label}</span>
                        <strong>{value || 'Não informado'}</strong>
                      </div>
                    ))}
                    {values.notes ? (
                      <div className="review-full">
                        <span>Observação</span>
                        <strong>{values.notes}</strong>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="form-actions">
                  <button className="form-button secondary" type="button" onClick={goBack} disabled={activeStep === 0}>
                    <ArrowLeft />
                    Voltar
                  </button>
                  <button className="form-button primary" type="submit">
                    {activeStep === steps.length - 1 ? (
                      <>
                        Solicitar orçamento
                        <Send />
                      </>
                    ) : (
                      <>
                        Continuar
                        <ArrowRight />
                      </>
                    )}
                  </button>
                </div>
              </form>

              <aside className="budget-summary-panel" aria-label="Resumo da solicitação">
                <span>Sua solicitação</span>
                <h3>{destinationSummary}</h3>
                <dl>
                  <div>
                    <dt>Datas</dt>
                    <dd>{dateSummary}</dd>
                  </div>
                  <div>
                    <dt>Viajantes</dt>
                    <dd>{travelersSummary}</dd>
                  </div>
                  <div>
                    <dt>Bagagem</dt>
                    <dd>{values.checkedBag || 'A definir'}</dd>
                  </div>
                  <div>
                    <dt>Serviços adicionais</dt>
                    <dd>{servicesSummary}</dd>
                  </div>
                </dl>
              </aside>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
