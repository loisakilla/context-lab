---
component: JxCheckbox
keywords: [checkbox, чекбокс, флажок, согласие, выбрать несколько, галочка]
---
Флажок с подписью. Внутри обычный `<input type="checkbox">`: `checked`, `onChange`, `name`, `disabled` передаются напрямую. Для взаимоисключающего выбора используйте `JxRadio`, для настроек «вкл/выкл» — `JxSwitch`.

## Props
- label: подпись рядом с флажком
- wrapClassName: класс на обёртке с подписью

## Examples
### Согласие с условиями
```tsx
function TermsConsent() {
  const [agreed, setAgreed] = useState(false);
  return (
    <JxCheckbox
      label="Согласен с условиями обработки данных"
      checked={agreed}
      onChange={(event) => setAgreed(event.target.checked)}
    />
  );
}
```
