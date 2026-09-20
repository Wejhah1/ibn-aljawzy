insert into public.whatsapp_templates (context, label, body) values
  ('attendance_absent', 'غياب في كشف الحضور', 'السلام عليكم، نود إعلامكم بأن الطالب {name} كان غائباً اليوم {day} الموافق {date} في {program} - {mosque}. نتمنى له دوام الحضور.'),
  ('attendance_late', 'تأخر في كشف الحضور', 'السلام عليكم، نود إعلامكم بأن الطالب {name} حضر متأخراً اليوم {day} الموافق {date} في {program} - {mosque}.'),
  ('students_list_contact', 'تواصل من قائمة الطلاب', 'السلام عليكم، معكم إدارة {program} في {mosque} بخصوص الطالب {name} (كود {barcode}).'),
  ('quick_ops_contact', 'تواصل من العمليات السريعة', 'السلام عليكم، معكم إدارة {program} في {mosque} بخصوص الطالب {name} من حلقة {circle}.')
on conflict (context) do nothing;

insert into public.app_settings (category, key, value) values
  ('program_info', 'program_name', '"حلقات ابن الجوزي الصيفي"'),
  ('program_info', 'mosque_name', '"مسجد الطرباق"'),
  ('program_info', 'address', '""'),
  ('program_info', 'contact_phone', '""'),
  ('printing', 'default_paper_orientation', '"portrait"')
on conflict (category, key) do nothing;
