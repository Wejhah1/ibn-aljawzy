/** يستخرج آخر 9 أرقام من رقم جوال لمطابقة مرنة بغض النظر عن رمز الدولة أو الصفر الأمامي */
export function lastDigits(phone: string, count = 9): string {
  const digits = phone.replace(/\D/g, "");
  return digits.slice(-count);
}
