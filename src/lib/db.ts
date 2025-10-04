
import fs from 'fs';
import path from 'path';

export interface Sorteo {
  id: string;
  nombre: string;
  fecha: string;
  precio: string;
  premio: string;
}

const sorteosFilePath = path.join(process.cwd(), 'src', 'lib', 'sorteos.json');

const readSorteosFromFile = (): Sorteo[] => {
  try {
    const fileContent = fs.readFileSync(sorteosFilePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    return [];
  }
};

const writeSorteosToFile = (sorteos: Sorteo[]) => {
  fs.writeFileSync(sorteosFilePath, JSON.stringify(sorteos, null, 2));
};

export const getSorteos = () => {
  return readSorteosFromFile();
};

export const addSorteo = (sorteoData: Omit<Sorteo, 'id'>) => {
  const sorteos = readSorteosFromFile();
  const newSorteo: Sorteo = {
    id: Date.now().toString(),
    ...sorteoData,
  };
  sorteos.push(newSorteo);
  writeSorteosToFile(sorteos);
  return newSorteo;
};
