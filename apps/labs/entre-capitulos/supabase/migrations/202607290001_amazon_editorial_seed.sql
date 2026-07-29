-- Initial Amazon.com.br editorial collection.
-- Every affiliate_url below was generated as a complete SiteStripe URL for
-- entrecapitu04-20. Keep the URL byte-for-byte as issued by Amazon.

insert into public.amazon_editorial_collections (
  slug,
  title,
  description,
  search_index,
  category,
  sort_order,
  active
) values (
  'em-destaque-amazon',
  'Em destaque na Amazon',
  'Uma seleção editorial para descobrir a próxima leitura.',
  'Books',
  'Literatura',
  10,
  true
)
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  search_index = excluded.search_index,
  category = excluded.category,
  sort_order = excluded.sort_order,
  active = excluded.active,
  updated_at = now();

insert into public.amazon_editorial_items (
  collection_id,
  asin,
  parent_asin,
  affiliate_url,
  title,
  authors,
  publisher,
  publication_date,
  format,
  category,
  sort_order,
  active
)
select
  collection.id,
  item.asin,
  item.parent_asin,
  item.affiliate_url,
  item.title,
  item.authors,
  item.publisher,
  item.publication_date,
  item.format,
  item.category,
  item.sort_order,
  true
from public.amazon_editorial_collections as collection
cross join (
  values
    (
      '6556927198',
      null::text,
      'https://www.amazon.com.br/Torto-arado-Itamar-Vieira-Junior/dp/6556927198?&linkCode=ll2&tag=entrecapitu04-20&linkId=46ba8e2caeaa429f238ceb6624dd8111&ref_=as_li_ss_tl',
      'Torto Arado',
      array['Itamar Vieira Junior']::text[],
      'Todavia',
      '2024',
      'hardcover',
      'Literatura brasileira',
      10
    ),
    (
      '6555320354',
      null::text,
      'https://www.amazon.com.br/dp/6555320354?&linkCode=ll2&tag=entrecapitu04-20&linkId=d885554379d966ba9e5e36d4a6761d9b&ref_=as_li_ss_tl',
      'A hora da estrela',
      array['Clarice Lispector']::text[],
      'Rocco',
      '2020',
      'paperback',
      'Clássicos',
      20
    ),
    (
      '8535930531',
      null::text,
      'https://www.amazon.com.br/dp/8535930531?&linkCode=ll2&tag=entrecapitu04-20&linkId=80150af7ad4ede5796f3a3a12b13078a&ref_=as_li_ss_tl',
      'Ensaio sobre a cegueira',
      array['José Saramago']::text[],
      'Companhia das Letras',
      '2017',
      'paperback',
      'Literatura portuguesa',
      30
    ),
    (
      '8535933395',
      null::text,
      'https://www.amazon.com.br/dp/8535933395?&linkCode=ll2&tag=entrecapitu04-20&linkId=c1770889a6a9d2e99b5cbfeb888eb752&ref_=as_li_ss_tl',
      'O avesso da pele',
      array['Jeferson Tenório']::text[],
      'Companhia das Letras',
      '2020',
      'paperback',
      'Literatura brasileira',
      40
    )
) as item (
  asin,
  parent_asin,
  affiliate_url,
  title,
  authors,
  publisher,
  publication_date,
  format,
  category,
  sort_order
)
where collection.slug = 'em-destaque-amazon'
on conflict (collection_id, asin) do update
set
  parent_asin = excluded.parent_asin,
  affiliate_url = excluded.affiliate_url,
  title = excluded.title,
  authors = excluded.authors,
  publisher = excluded.publisher,
  publication_date = excluded.publication_date,
  format = excluded.format,
  category = excluded.category,
  sort_order = excluded.sort_order,
  active = excluded.active,
  updated_at = now();
