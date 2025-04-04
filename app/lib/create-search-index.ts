export async function createSearchIndex() {
  try {
    const indexDefinition = {
      name: 'index02',
      fields: [
        {
          name: 'id',
          type: 'Edm.String',
          key: true,
          searchable: false,
          filterable: true,
          sortable: true,
          facetable: true,
          retrievable: true
        },
        {
          name: 'title',
          type: 'Edm.String',
          key: false,
          searchable: true,
          filterable: true,
          sortable: false,
          facetable: false,
          retrievable: true
        },
        {
          name: 'content',
          type: 'Edm.String',
          key: false,
          searchable: true,
          filterable: false,
          sortable: false,
          facetable: false,
          retrievable: true
        },
        {
          name: 'question',
          type: 'Edm.String',
          key: false,
          searchable: true,
          filterable: true,
          sortable: false,
          facetable: false,
          retrievable: true
        },
        {
          name: 'answer',
          type: 'Edm.String',
          key: false,
          searchable: true,
          filterable: false,
          sortable: false,
          facetable: false,
          retrievable: true
        },
        {
          name: 'club_id',
          type: 'Edm.String',
          key: false,
          searchable: false,
          filterable: true,
          sortable: false,
          facetable: true,
          retrievable: true
        },
        {
          name: 'type',
          type: 'Edm.String',
          key: false,
          searchable: false,
          filterable: true,
          sortable: false,
          facetable: true,
          retrievable: true
        }
      ],
      semantic: {
        configurations: [
          {
            name: 'default',
            prioritizedFields: {
              titleField: {
                fieldName: 'title'
              },
              prioritizedContentFields: [
                {
                  fieldName: 'content'
                }
              ],
              prioritizedKeywordsFields: []
            }
          }
        ]
      }
    };

    // Create the index using REST API
    const response = await fetch(`${process.env.AZURE_SEARCH_ENDPOINT}/indexes/index02?api-version=2023-11-01`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.AZURE_SEARCH_KEY || ''
      },
      body: JSON.stringify(indexDefinition)
    });

    if (!response.ok) {
      throw new Error(`Failed to create index: ${response.statusText}`);
    }

    console.log('Index created successfully');
    return { success: true, message: 'Index created successfully' };
  } catch (error) {
    console.error('Error creating index:', error);
    return { success: false, message: String(error) };
  }
} 