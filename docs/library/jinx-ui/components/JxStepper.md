---
component: JxStepper
keywords: [stepper, шаги, пошаговая форма, мастер, wizard, прогресс по шагам]
---
Индикатор шагов для пошаговых форм. Показывает пройденные, текущий и будущие шаги; переключение шагов делает родитель. Шаги описываются массивом `JxStep` с полем `label`, `current` — индекс текущего шага с нуля.

## Props
- steps: список шагов `{ label }`
- current: индекс текущего шага, с нуля

## Examples
### Трёхшаговая форма
```tsx
function CheckoutSteps() {
  const [step, setStep] = useState(0);
  return (
    <>
      <JxStepper steps={[{ label: 'Контакты' }, { label: 'Адрес' }, { label: 'Проверка' }]} current={step} />
      <JxButton variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
        Назад
      </JxButton>
      <JxButton variant="primary" onClick={() => setStep(Math.min(step + 1, 2))}>
        Дальше
      </JxButton>
    </>
  );
}
```
