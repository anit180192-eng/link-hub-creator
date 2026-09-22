export function isStrongPin(pin: string): boolean {
  return pin.length === 6 && /^\d{6}$/.test(pin)
    && !/^(\d)\1{5}$/.test(pin)
    && !"0123456789".includes(pin)
    && !"9876543210".includes(pin);
}
