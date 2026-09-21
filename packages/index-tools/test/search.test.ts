import { describe, expect, it } from 'vitest';
import { editDistance, findComponent, searchComponents, suggestNames } from '../src/search.ts';
import { sampleIndex } from './helpers.ts';

const index = sampleIndex();

describe('searchComponents', () => {
  it('находит компонент по русскому запросу через ключевые слова', () => {
    const hits = searchComponents(index, 'модальное окно подтверждения');
    expect(hits[0]?.component.name).toBe('JxModal');
    expect(hits[0]?.matchedOn).toContain('keywords');
  });

  it('точное имя без префикса Jx выигрывает у частичных совпадений', () => {
    const hits = searchComponents(index, 'button');
    expect(hits[0]?.component.name).toBe('JxButton');
    expect(hits[0]?.matchedOn).toContain('name');
  });

  it('понижает deprecated-компоненты относительно живых при совпадении по ключевым словам', () => {
    const hits = searchComponents(index, 'menu dropdown');
    expect(hits.map((hit) => hit.component.name)).toEqual(['JxMenu', 'JxDropdown']);
  });

  it('точное имя компонента находит его даже с пометкой deprecated', () => {
    expect(searchComponents(index, 'dropdown')[0]?.component.name).toBe('JxDropdown');
  });

  it('прощает опечатку в имени', () => {
    const hits = searchComponents(index, 'Modul');
    expect(hits[0]?.component.name).toBe('JxModal');
  });

  it('пустой запрос отдаёт первые компоненты без очков', () => {
    const hits = searchComponents(index, '   ', 2);
    expect(hits).toHaveLength(2);
    expect(hits.every((hit) => hit.score === 0)).toBe(true);
  });
});

describe('findComponent и suggestNames', () => {
  it('ищет без учёта регистра и без префикса', () => {
    expect(findComponent(index, 'jxmodal')?.name).toBe('JxModal');
    expect(findComponent(index, 'Modal')?.name).toBe('JxModal');
    expect(findComponent(index, 'Nope')).toBeUndefined();
  });

  it('подсказывает похожие имена для несуществующего компонента', () => {
    expect(suggestNames(index, 'Modul')).toContain('JxModal');
    expect(suggestNames(index, 'Buton')).toContain('JxButton');
  });
});

describe('editDistance', () => {
  it('считает расстояние Левенштейна', () => {
    expect(editDistance('modal', 'modul')).toBe(1);
    expect(editDistance('', 'abc')).toBe(3);
    expect(editDistance('same', 'same')).toBe(0);
  });
});
