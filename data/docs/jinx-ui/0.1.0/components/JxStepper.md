# JxStepper

Индикатор шагов для пошаговых форм. Показывает пройденные, текущий и будущие шаги; переключение шагов делает родитель. Шаги описываются массивом `JxStep` с полем `label`, `current` — индекс текущего шага с нуля.

Импорт: `import { JxStepper } from '@jinx-ui/react'`  
Источник: `dist/components/Stepper.d.ts:9`
Ключевые слова: stepper, шаги, пошаговая форма, мастер, wizard, прогресс по шагам

## Сигнатура

```tsx
<JxStepper current: number; steps: JxStep[] />
```

Наследует `HTMLAttributes<HTMLDivElement>`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `current` | `number` | да |  | индекс текущего шага, с нуля |
| `steps` | `JxStep[]` | да |  | список шагов `{ label }` |

## CSS-классы

`jx-step`, `jx-step-bubble`, `jx-step-label`, `jx-stepper`

## Примеры

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
