/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PictogramCategory, Pictogram, QuickMessage, Patient, MedicalSession, ChatMessage, ConsentRequest } from '../types';

export const mockCategories: PictogramCategory[] = [
  { id: 'cat-1', name: 'Dolor', slug: 'dolor', description: 'Localización e intensidad de dolores físicos' },
  { id: 'cat-2', name: 'Síntomas', slug: 'sintomas', description: 'Malestares comunes y signos clínicos' },
  { id: 'cat-3', name: 'Necesidades', slug: 'necesidades', description: 'Requerimientos inmediatos del paciente' },
  { id: 'cat-4', name: 'Información Médica', slug: 'info-medica', description: 'Antecedentes, alergias y estados de salud' },
  { id: 'cat-5', name: 'Respuestas', slug: 'respuestas', description: 'Respuestas rápidas para entablar diálogo' }
];

export const mockPictograms: Pictogram[] = [
  // DOLOR
  {
    id: 'pic-101',
    categoryId: 'cat-1',
    title: 'Dolor de cabeza',
    phrase: 'Me duele la cabeza',
    iconName: 'Activity',
    speechText: 'Tengo dolor de cabeza',
    isActive: true,
    colorClass: 'border-brand-coral bg-brand-coral-light/20 text-brand-coral-dark'
  },
  {
    id: 'pic-102',
    categoryId: 'cat-1',
    title: 'Dolor de pecho',
    phrase: 'Siento dolor en el pecho',
    iconName: 'Heart',
    speechText: 'Me duele el pecho, siento opresión',
    isActive: true,
    colorClass: 'border-brand-coral bg-brand-coral-light/20 text-brand-coral-dark'
  },
  {
    id: 'pic-103',
    categoryId: 'cat-1',
    title: 'Dolor de estómago',
    phrase: 'Me duele el estómago',
    iconName: 'FlameKindling',
    speechText: 'Tengo dolor abdominal',
    isActive: true,
    colorClass: 'border-brand-coral bg-brand-coral-light/20 text-brand-coral-dark'
  },
  {
    id: 'pic-104',
    categoryId: 'cat-1',
    title: 'Mucho dolor',
    phrase: 'Siento un dolor muy fuerte',
    iconName: 'Zap',
    speechText: 'Mi dolor es muy intenso',
    isActive: true,
    colorClass: 'border-brand-coral bg-brand-coral-light/20 text-brand-coral-dark font-bold'
  },
  {
    id: 'pic-105',
    categoryId: 'cat-1',
    title: 'Dolor de garganta',
    phrase: 'Me duele al tragar',
    iconName: 'Speech',
    speechText: 'Tengo dolor de garganta',
    isActive: true,
    colorClass: 'border-brand-coral bg-brand-coral-light/20 text-brand-coral-dark'
  },

  // SÍNTOMAS
  {
    id: 'pic-201',
    categoryId: 'cat-2',
    title: 'Tengo fiebre',
    phrase: 'Siento que tengo fiebre y escalofríos',
    iconName: 'Thermometer',
    speechText: 'Tengo fiebre y temperatura alta',
    isActive: true,
    colorClass: 'border-brand-yellow bg-brand-yellow-light/20 text-brand-yellow-dark'
  },
  {
    id: 'pic-202',
    categoryId: 'cat-2',
    title: 'Tengo mareos',
    phrase: 'Me siento mareado y todo me da vueltas',
    iconName: 'RefreshCw',
    speechText: 'Me siento mareado y con inestabilidad',
    isActive: true,
    colorClass: 'border-brand-yellow bg-brand-yellow-light/20 text-brand-yellow-dark'
  },
  {
    id: 'pic-203',
    categoryId: 'cat-2',
    title: 'Tengo náuseas',
    phrase: 'Tengo ganas de vomitar',
    iconName: 'Wind',
    speechText: 'Siento náuseas',
    isActive: true,
    colorClass: 'border-brand-yellow bg-brand-yellow-light/20 text-brand-yellow-dark'
  },
  {
    id: 'pic-204',
    categoryId: 'cat-2',
    title: 'Dificultad al respirar',
    phrase: 'Me cuesta respirar bien',
    iconName: 'Activity',
    speechText: 'Me falta el aire o tengo dificultad para respirar',
    isActive: true,
    colorClass: 'border-brand-coral bg-brand-coral-light/20 text-brand-coral-dark font-bold'
  },
  {
    id: 'pic-205',
    categoryId: 'cat-2',
    title: 'Tengo frío',
    phrase: 'Siento frío corporal',
    iconName: 'CloudSnow',
    speechText: 'Tengo mucho frío',
    isActive: true,
    colorClass: 'border-brand-yellow bg-brand-yellow-light/20 text-brand-yellow-dark'
  },

  // NECESIDADES
  {
    id: 'pic-301',
    categoryId: 'cat-3',
    title: 'Ir al baño',
    phrase: 'Necesito ir al baño urgentemente',
    iconName: 'Smile',
    speechText: '¿Puedo ir al baño por favor?',
    isActive: true,
    colorClass: 'border-brand-primary bg-brand-light/30 text-brand-primary'
  },
  {
    id: 'pic-302',
    categoryId: 'cat-3',
    title: 'Necesito agua',
    phrase: 'Tengo mucha sed, ¿me da agua?',
    iconName: 'Droplet',
    speechText: 'Necesito beber agua por favor',
    isActive: true,
    colorClass: 'border-brand-primary bg-brand-light/30 text-brand-primary'
  },
  {
    id: 'pic-303',
    categoryId: 'cat-3',
    title: 'Intérprete LSCh',
    phrase: 'Necesito un intérprete de Lengua de Señas',
    iconName: 'Accessibility',
    speechText: 'Solicito apoyo de un intérprete de lengua de señas chilena',
    isActive: true,
    colorClass: 'border-brand-turquoise bg-brand-success-light/30 text-brand-turquoise-dark font-semibold'
  },
  {
    id: 'pic-304',
    categoryId: 'cat-3',
    title: 'Contactar familia',
    phrase: 'Por favor, llamen a mi contacto de emergencia',
    iconName: 'Users',
    speechText: 'Necesito comunicarme con mi familia',
    isActive: true,
    colorClass: 'border-brand-primary bg-brand-light/30 text-brand-primary'
  },
  {
    id: 'pic-305',
    categoryId: 'cat-3',
    title: 'Sentarse',
    phrase: 'Necesito sentarme un momento',
    iconName: 'ArrowDownCircle',
    speechText: 'Siento cansancio, necesito tomar asiento',
    isActive: true,
    colorClass: 'border-brand-primary bg-brand-light/30 text-brand-primary'
  },

  // INFO MÉDICA
  {
    id: 'pic-401',
    categoryId: 'cat-4',
    title: 'Tengo alergia',
    phrase: 'Soy una persona alérgica',
    iconName: 'AlertTriangle',
    speechText: 'Tengo alergia alimentaria o de medicamentos',
    isActive: true,
    colorClass: 'border-brand-coral bg-brand-coral-light/20 text-brand-coral-dark'
  },
  {
    id: 'pic-402',
    categoryId: 'cat-4',
    title: 'Tomo remedios',
    phrase: 'Tomo medicamentos de forma diaria',
    iconName: 'Briefcase',
    speechText: 'Estoy bajo tratamiento farmacológico activo',
    isActive: true,
    colorClass: 'border-brand-primary bg-brand-light/30 text-brand-primary'
  },
  {
    id: 'pic-403',
    categoryId: 'cat-4',
    title: 'Embarazo',
    phrase: 'Estoy embarazada',
    iconName: 'Baby',
    speechText: 'Estoy cursando un embarazo',
    isActive: true,
    colorClass: 'border-brand-primary bg-brand-light/30 text-brand-primary'
  },
  {
    id: 'pic-404',
    categoryId: 'cat-4',
    title: 'Diabetes',
    phrase: 'Tengo diabetes',
    iconName: 'Activity',
    speechText: 'Soy paciente diabético',
    isActive: true,
    colorClass: 'border-brand-primary bg-brand-light/30 text-brand-primary'
  },

  // RESPUESTAS
  {
    id: 'pic-501',
    categoryId: 'cat-5',
    title: 'Sí',
    phrase: 'Sí, es correcto',
    iconName: 'Check',
    speechText: 'Sí',
    isActive: true,
    colorClass: 'border-brand-success bg-brand-success-light/30 text-brand-success font-bold'
  },
  {
    id: 'pic-502',
    categoryId: 'cat-5',
    title: 'No',
    phrase: 'No, no es así',
    iconName: 'X',
    speechText: 'No',
    isActive: true,
    colorClass: 'border-brand-coral bg-brand-coral-light/20 text-brand-coral font-bold'
  },
  {
    id: 'pic-503',
    categoryId: 'cat-5',
    title: 'No entiendo',
    phrase: 'No logro comprender lo que dice',
    iconName: 'HelpCircle',
    speechText: 'No entiendo, ¿podría explicarlo de otra forma?',
    isActive: true,
    colorClass: 'border-brand-yellow bg-brand-yellow-light/20 text-brand-yellow-dark'
  },
  {
    id: 'pic-504',
    categoryId: 'cat-5',
    title: 'Escribir',
    phrase: 'Prefiero que nos comuniquemos por texto escrito',
    iconName: 'FileText',
    speechText: 'Por favor, prefiero leer o escribir',
    isActive: true,
    colorClass: 'border-brand-primary bg-brand-light/30 text-brand-primary'
  }
];

export const mockQuickMessages: QuickMessage[] = [
  { id: 'qm-1', phrase: 'Sí', iconName: 'Check', category: 'positive' },
  { id: 'qm-2', phrase: 'No', iconName: 'X', category: 'negative' },
  { id: 'qm-3', phrase: 'No entiendo', iconName: 'HelpCircle', category: 'help' },
  { id: 'qm-4', phrase: 'Repita por favor', iconName: 'RotateCcw', category: 'help' },
  { id: 'qm-5', phrase: 'Necesito más tiempo', iconName: 'Clock', category: 'neutral' },
  { id: 'qm-6', phrase: 'Prefiero escribir', iconName: 'FileText', category: 'neutral' },
  { id: 'qm-7', phrase: 'Necesito ayuda', iconName: 'AlertCircle', category: 'danger' },
  { id: 'qm-8', phrase: 'Necesito intérprete', iconName: 'Accessibility', category: 'positive' }
];

export const mockPatient: Patient = {
  id: 'pat-001',
  name: 'Ana María Torres',
  age: 28,
  communicationPreference: 'LSCh (Lengua de Señas Chilena) y texto escrito',
  ctaCode: 'SV-847291',
  rut: '19.482.903-K',
  birthDate: '15/11/1997',
  prevision: 'FONASA B',
  address: 'Av. Pedro de Valdivia 1420, Depto 402, Temuco',
  cesfam: 'CESFAM Villarrica Centro',
  phone: '+56 9 7462 8193',
  allergies: ['Penicilina', 'Lactosa'],
  bloodType: 'O-Rh Positive',
  conditions: ['Hipotiroidismo leve'],
  emergencyContact: {
    name: 'Carlos Torres Solís',
    relationship: 'Padre',
    phone: '+56 9 8473 9201',
    allowSos: true,
    allowUpdates: true
  }
};

export const mockSession: MedicalSession = {
  id: 'sess-1001',
  patientId: 'pat-001',
  patientName: 'Ana María Torres',
  patientAge: 28,
  communicationPreference: 'LSCh y texto',
  organizationId: 'org-chile-salud',
  healthCenterId: 'hc-villarrica',
  unitId: 'unit-urgencias',
  status: 'active',
  startedAt: '2026-07-12T11:00:00Z',
  currentStage: 'Categorización',
  createdBy: 'usr-admin'
};

export const initialConsents: ConsentRequest[] = [
  {
    id: 'con-1',
    sessionId: 'sess-1001',
    consentType: 'start_care',
    title: 'Inicio de Atención Inclusiva',
    description: 'Permitir al personal abrir un canal de asistencia inclusivo en SEÑAVIDA para mediar la comunicación durante la consulta médica.',
    status: 'granted',
    requestedAt: '2026-07-12T11:01:00Z'
  },
  {
    id: 'con-2',
    sessionId: 'sess-1001',
    consentType: 'clinical_data',
    title: 'Acceso a Datos de Salud',
    description: 'Autorizar que el médico y personal de categorización consulten sus alergias declaradas, medicamentos y grupo sanguíneo dentro de SEÑAVIDA.',
    status: 'granted',
    requestedAt: '2026-07-12T11:01:10Z'
  },
  {
    id: 'con-3',
    sessionId: 'sess-1001',
    consentType: 'camera',
    title: 'Uso de Cámara para Señas',
    description: 'Habilitar el sensor óptico en el dispositivo de consulta para realizar traducción asistida de señas a texto mediante algoritmos locales de IA.',
    status: 'pending',
    requestedAt: '2026-07-12T11:02:00Z'
  },
  {
    id: 'con-4',
    sessionId: 'sess-1001',
    consentType: 'share_with_contacts',
    title: 'Compartir actualizaciones con Contactos',
    description: 'Permitir que el sistema envíe reportes informativos de su estado o traslados a su contacto de emergencia designado.',
    status: 'pending',
    requestedAt: '2026-07-12T11:03:00Z'
  }
];

export const initialChatHistory: ChatMessage[] = [
  {
    id: 'msg-1',
    sessionId: 'sess-1001',
    senderType: 'system',
    senderName: 'SEÑAVIDA',
    messageType: 'system',
    body: 'Atención médica iniciada mediante código SV-847291 en Centro de Salud Villarrica.',
    origin: 'system',
    status: 'read',
    sentAt: '2026-07-12T11:00:15Z'
  },
  {
    id: 'msg-2',
    sessionId: 'sess-1001',
    senderType: 'staff',
    senderName: 'María José (Admisión)',
    messageType: 'text',
    body: 'Hola Ana, muy buenos días. Bienvenida. Iniciamos tu registro. ¿Cuál es tu motivo de consulta hoy?',
    origin: 'admission',
    status: 'read',
    sentAt: '2026-07-12T11:01:30Z'
  },
  {
    id: 'msg-3',
    sessionId: 'sess-1001',
    senderType: 'patient',
    senderName: 'Ana María Torres',
    messageType: 'pictogram',
    body: 'Me duele mucho la cabeza y tengo náuseas',
    pictogramPath: 'pic-101',
    origin: 'patient',
    status: 'read',
    sentAt: '2026-07-12T11:02:10Z',
    confirmedByPatientAt: '2026-07-12T11:02:05Z'
  },
  {
    id: 'msg-4',
    sessionId: 'sess-1001',
    senderType: 'staff',
    senderName: 'María José (Admisión)',
    messageType: 'text',
    body: 'Entendido, dolor de cabeza y náuseas. Procederé con tu ingreso a la sala de Categorización para control de signos vitales. ¿Vienes acompañada de algún familiar?',
    origin: 'admission',
    status: 'read',
    sentAt: '2026-07-12T11:03:00Z'
  },
  {
    id: 'msg-5',
    sessionId: 'sess-1001',
    senderType: 'patient',
    senderName: 'Ana María Torres',
    messageType: 'text',
    body: 'No, vengo sola. Pero mi papá está atento al teléfono.',
    origin: 'patient',
    status: 'read',
    sentAt: '2026-07-12T11:03:50Z'
  }
];

export const vocabularySigns = [
  { term: 'Dolor de cabeza', explanation: 'Tocar la sien derecha con los dedos extendidos y realizar círculos suaves.' },
  { term: 'Dolor de estómago', explanation: 'Colocar la palma abierta sobre el abdomen y contraer los dedos imitando espasmos.' },
  { term: 'Necesito intérprete', explanation: 'Cruzar los dedos índice y medio de ambas manos e imitar un puente de comunicación.' },
  { term: 'Tengo fiebre', explanation: 'Apoyar el dorso de la mano derecha sobre la frente frunciendo ligeramente el ceño.' },
  { term: 'Necesito agua', explanation: 'Cerrar la mano derecha dejando el pulgar extendido apuntando hacia los labios.' },
  { term: 'Soy alérgico', explanation: 'Rascar suavemente el dorso del antebrazo izquierdo con las yemas de la mano derecha.' }
];
