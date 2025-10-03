export interface Sorteo {
  id: string;
  nombre: string;
  fecha: string;
  precio: string;
  premio: string;
}

// In-memory database
let sorteos: Sorteo[] = [];

export const getSorteos = () => sorteos;

export const addSorteo = (sorteoData: Omit<Sorteo, 'id'>) => {
  const newSorteo: Sorteo = {
    id: Date.now().toString(),
    ...sorteoData,
  };
  sorteos.push(newSorteo);
  return newSorteo;
};
