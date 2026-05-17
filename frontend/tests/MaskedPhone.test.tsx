/**
 * tests/MaskedPhone.test.tsx
 *
 * Тестуємо React-компонент MaskedPhone
 *
 * 🎓 ЩО ТАКЕ INTEGRATION-ТЕСТ КОМПОНЕНТА:
 *   Ми рендеримо компонент у jsdom і перевіряємо що він показує правильний текст.
 *   Не тестуємо верстку — тестуємо поведінку з точки зору користувача.
 *
 * 🎓 КЛЮЧОВІ КОНЦЕПЦІЇ ДЛЯ ІНТЕРВ'Ю:
 *   render()           — рендерить компонент у jsdom
 *   screen.getByText() — знаходить елемент за текстом (як "бачить" користувач)
 *   screen.queryByText() — те саме але повертає null замість throw якщо не знайдено
 *   toBeInTheDocument() — з @testing-library/jest-dom, перевіряє що елемент є в DOM
 *
 * 🎓 ПРИНЦИП testing-library:
 *   "Тестуй так як користувач взаємодіє з UI, не деталі реалізації"
 *   Не: expect(component.state.masked).toBe(...)
 *   А:  expect(screen.getByText("+380 ** *** ** 67")).toBeInTheDocument()
 */

import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MaskedPhone from "../components/ui/MaskedPhone";

describe("MaskedPhone", () => {
  // ✅ Основний сценарій — показує маскований номер
  test("показує маскований номер за замовчуванням", () => {
    render(<MaskedPhone phone="+380501234567" />);

    // 🎓 screen.getByText — шукає по тексту який бачить юзер
    // Якщо не знайде — кине error і тест провалиться
    expect(screen.getByText("+380 ** *** ** 67")).toBeInTheDocument();
  });

  test("показує повний номер якщо revealed=true", () => {
    render(<MaskedPhone phone="+380501234567" revealed={true} />);

    // Відформатований вигляд: +380 (50) 123-45-67
    expect(screen.getByText("+380 (50) 123-45-67")).toBeInTheDocument();
  });

  // 🎓 Edge case — null/undefined
  test("показує 'Не вказано' якщо phone=null", () => {
    render(<MaskedPhone phone={null} />);
    expect(screen.getByText("Не вказано")).toBeInTheDocument();
  });

  test("показує 'Не вказано' якщо phone=undefined", () => {
    render(<MaskedPhone phone={undefined} />);
    expect(screen.getByText("Не вказано")).toBeInTheDocument();
  });

  // 🎓 queryByText — перевіряємо що чогось НЕМАЄ в DOM
  test("НЕ показує повний номер коли revealed=false", () => {
    render(<MaskedPhone phone="+380501234567" />);

    // queryByText повертає null якщо не знайдено (getByText кинув би error)
    expect(screen.queryByText("+380 (50) 123-45-67")).not.toBeInTheDocument();
  });

  test("маскує останні 2 цифри коректно", () => {
    render(<MaskedPhone phone="+380671112299" />);
    expect(screen.getByText("+380 ** *** ** 99")).toBeInTheDocument();
  });
});
