import React from 'react';
import { Card } from '../types/card';
import CardTable from './CardTable';

interface CardListProps {
  cards: Card[];
}

const CardList: React.FC<CardListProps> = ({ cards }) => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Card List</h1>
      <CardTable cards={cards} />
    </div>
  );
};

export default CardList;