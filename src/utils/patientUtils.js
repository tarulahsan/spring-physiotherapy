export const generatePatientId = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${year}-${month}-${day}-${random}`;
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-GB');
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('bn-BD', {
    style: 'currency',
    currency: 'BDT'
  }).format(amount);
};

export const SESSIONS = Array.from({ length: 10 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}${getOrdinalSuffix(i + 1)} Session`
}));

export const DOCTORS = [
  { id: 1, name: 'Dr. Rahman' },
  { id: 2, name: 'Dr. Akter' },
  { id: 3, name: 'Dr. Khan' },
];

function getOrdinalSuffix(number) {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = number % 100;
  return suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
}
