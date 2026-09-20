export interface WhatsappVariables {
  name?: string;
  program?: string;
  mosque?: string;
  barcode?: string;
  date?: string;
  day?: string;
  status?: string;
  circle?: string;
}

export function fillTemplate(body: string, vars: WhatsappVariables): string {
  return body.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = vars[key as keyof WhatsappVariables];
    return value ?? match;
  });
}

/** ينظّف رقم الجوال ويضيف رمز الدولة الافتراضي (السعودية) إن لم يوجد */
export function toInternationalPhone(phone: string, defaultCountryCode = "966") {
  let digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits.slice(1);
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return defaultCountryCode + digits.slice(1);
  if (digits.startsWith(defaultCountryCode)) return digits;
  return defaultCountryCode + digits;
}

export function buildWaMeLink(phone: string, message: string) {
  const intlPhone = toInternationalPhone(phone);
  return `https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`;
}

export const DEFAULT_WHATSAPP_TEMPLATES: Record<string, string> = {
  attendance_absent:
    "السلام عليكم، نود إعلامكم بأن الطالب {name} كان غائباً اليوم {day} الموافق {date} في {program} - {mosque}. نتمنى له دوام الحضور.",
  attendance_late:
    "السلام عليكم، نود إعلامكم بأن الطالب {name} حضر متأخراً اليوم {day} الموافق {date} في {program} - {mosque}.",
  students_list_contact:
    "السلام عليكم، معكم إدارة {program} في {mosque} بخصوص الطالب {name} (كود {barcode}).",
  quick_ops_contact:
    "السلام عليكم، معكم إدارة {program} في {mosque} بخصوص الطالب {name} من حلقة {circle}.",
};
