import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/shared/PageHeader';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search } from 'lucide-react';

export default function AllBranches() {
  const [search, setSearch] = useState('');

  const { data: branches = [] } = useQuery({
    queryKey: ['allBranches'],
    queryFn: () => base44.entities.Branches.list('-created_date'),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['allCustomers'],
    queryFn: () => base44.entities.Customers.list(),
  });

  const getCompany = (cid) => customers.find(c => c.customer_id === cid)?.company_name || cid;

  const filtered = branches.filter(b => {
    const q = search.toLowerCase();
    return !search || b.brand?.toLowerCase().includes(q) || b.customer_id?.toLowerCase().includes(q) || b.area?.toLowerCase().includes(q);
  });

  return (
    <div>
      <PageHeader title="分店管理" description={`共 ${branches.length} 間分店`} />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="搜尋品牌、地區或客戶編號..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>客戶</TableHead>
              <TableHead>品牌</TableHead>
              <TableHead>地區</TableHead>
              <TableHead>地址</TableHead>
              <TableHead>聯絡人</TableHead>
              <TableHead>電話</TableHead>
              <TableHead>電郵</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(b => (
              <TableRow key={b.id}>
                <TableCell className="text-sm font-medium">{getCompany(b.customer_id)}</TableCell>
                <TableCell className="font-medium">{b.brand}</TableCell>
                <TableCell>{b.area}</TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-48 truncate">{b.address}</TableCell>
                <TableCell>{b.contact_person}</TableCell>
                <TableCell>{b.phone}</TableCell>
                <TableCell className="text-sm">{b.email}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}