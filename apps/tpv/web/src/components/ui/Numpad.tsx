'use client';

import { Delete } from 'lucide-react';

interface NumpadProps {
  value: string;
  onChange: (value: string) => void;
  onEnter?: () => void;
  maxDecimals?: number;
  maxValue?: number;
}

export function Numpad({
  value,
  onChange,
  onEnter,
  maxDecimals = 2,
  maxValue = 999999.99,
}: NumpadProps) {
  const handleNumber = (num: string) => {
    let newValue = value + num;

    // Validar decimales
    if (newValue.includes('.')) {
      const parts = newValue.split('.');
      if (parts[1].length > maxDecimals) return;
    }

    // Validar máximo
    const numValue = parseFloat(newValue);
    if (!isNaN(numValue) && numValue > maxValue) return;

    onChange(newValue);
  };

  const handleDecimal = () => {
    if (!value.includes('.')) {
      onChange(value === '' ? '0.' : value + '.');
    }
  };

  const handleBackspace = () => {
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    onChange('');
  };

  const buttons = [
    { label: '7', action: () => handleNumber('7') },
    { label: '8', action: () => handleNumber('8') },
    { label: '9', action: () => handleNumber('9') },
    { label: '4', action: () => handleNumber('4') },
    { label: '5', action: () => handleNumber('5') },
    { label: '6', action: () => handleNumber('6') },
    { label: '1', action: () => handleNumber('1') },
    { label: '2', action: () => handleNumber('2') },
    { label: '3', action: () => handleNumber('3') },
    { label: '0', action: () => handleNumber('0') },
    { label: '.', action: handleDecimal },
    { label: 'C', action: handleClear, className: 'bg-red-100 text-red-600 hover:bg-red-200' },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {buttons.map((btn, idx) => (
        <button
          key={idx}
          onClick={btn.action}
          className={`numpad-btn ${btn.className || ''}`}
        >
          {btn.label}
        </button>
      ))}

      {/* Botón borrar */}
      <button
        onClick={handleBackspace}
        className="numpad-btn col-span-2 bg-gray-200 hover:bg-gray-300"
      >
        <Delete className="w-6 h-6" />
      </button>

      {/* Botón OK */}
      {onEnter && (
        <button
          onClick={onEnter}
          className="numpad-btn numpad-btn-action"
        >
          OK
        </button>
      )}
    </div>
  );
}

// Variante compacta para espacios pequeños
export function NumpadCompact({
  value,
  onChange,
  onEnter,
}: {
  value: string;
  onChange: (value: string) => void;
  onEnter?: () => void;
}) {
  const handleKey = (key: string) => {
    if (key === 'C') {
      onChange('');
    } else if (key === '⌫') {
      onChange(value.slice(0, -1));
    } else if (key === '.') {
      if (!value.includes('.')) {
        onChange(value === '' ? '0.' : value + '.');
      }
    } else {
      onChange(value + key);
    }
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

  return (
    <div className="grid grid-cols-3 gap-1">
      {keys.map((key) => (
        <button
          key={key}
          onClick={() => handleKey(key)}
          className="h-12 text-xl font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors"
        >
          {key}
        </button>
      ))}
    </div>
  );
}
