// Wait for HTML document to load before running any scripts
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - get references to HTML elements
    const ioCTableBody = document.getElementById('iocTableBody');
    // Filter Elements
    const filterForm = document.getElementById('filterForm');
    // Get the button used to clear the active filters
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');

    // Get the hidden modal container
    const modal = document.getElementById('iocModal');
    // Get the button that opens the modal to add a new IOC
    const addBtn = document.getElementById('addIocBtn');
    // Get all buttons intended to close the modal
    const closeBtns = document.querySelectorAll('.close-btn, .close-modal-btn');
    // Get the form inside the modal
    const iocForm = document.getElementById('iocForm');
    const modalTitle = document.getElementById('modalTitle');

    // Dropdown elements for filtering and selecting actors
    const filterActorSelect = document.getElementById('filterActor');
    // Get the dropdown for actors in the form
    const modalActorSelect = document.getElementById('actorId');



    // Transaction Modal Elements
    const transactionModal = document.getElementById('transactionModal');
    const addTransactionBtn = document.getElementById('addTransactionBtn');
    const closeTransactionBtns = document.querySelectorAll('.close-transaction-btn');
    const transactionForm = document.getElementById('transactionForm');

    // Base URL for API requests
    //const API_BASE = 'http://localhost:3000/api';

    // Base URL for API requests - using relative path so it works on any domain (localhost or cloud)
    const API_BASE = '/api';

    // Initialize data - fetch actors and IOCs when the page loads
    fetchActors();
    fetchIOCs();

    // Fetch Threat Actors for dropdowns - populate with actor names
    async function fetchActors() {
        try {
            // Make a GET request to the /api/actors endpoint
            const res = await fetch(`${API_BASE}/actors`);
            // Parse the returned JSON response into a JavaScript array
            const actors = await res.json();

            // Clear existing options and add a default "All Actors" option
            filterActorSelect.innerHTML = '<option value="">All Actors</option>';
            // Clear existing options and add a default "Select Actor" option
            modalActorSelect.innerHTML = '<option value="">-- Select Actor --</option>';

            // Loop through each actor in the array
            actors.forEach(actor => {
                // Create a new <option> element for the filter dropdown
                const optFilter = new Option(actor.name, actor.id);
                // Create a new <option> element for the select dropdown
                const optModal = new Option(actor.name, actor.id);
                // Add the option to the filter dropdown
                filterActorSelect.add(optFilter);
                // Add the option to the select dropdown
                modalActorSelect.add(optModal);
            });
        } catch (error) {
            // Log any errors that occur during the network request
            console.error('Error fetching actors:', error);
        }
    }

    // Fetch IOC data and render the main table
    // It accepts an optional queryString (e.g. "?severity=High") to filter results
    async function fetchIOCs(queryString = '') {
        try {
            // Make a GET request to the /api/iocs endpoint, appending the query string
            const res = await fetch(`${API_BASE}/iocs${queryString}`);
            // Parse the returned JSON response into a JavaScript array
            const iocs = await res.json();
            // update the HTML table with the retrieved data
            renderTable(iocs);
        } catch (error) {
            // Log any errors that occur during the process
            console.error('Error fetching IOCs:', error);
        }
    }

    // Function to generate the HTML table rows from IOC data array
    function renderTable(iocs) {
        // Clear out any existing rows in the table body
        ioCTableBody.innerHTML = '';

        // If the database returned an empty array, display a "No data" message
        if (iocs.length === 0) {
            ioCTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No data found</td></tr>';
            return;
        }

        iocs.forEach(ioc => {
            // Create a new <tr> element to create a row for each IOC
            const tr = document.createElement('tr');
            // Convert severity to lowercase and assign a class for styling
            const cleanSeverity = ioc.severity ? ioc.severity.toLowerCase() : '';
            // Determine the appropriate CSS class for the severity badge
            const badgeClass = `badge badge-${cleanSeverity}`;

            // Set the inner HTML of the table row with the IOC data
            // Use template literals to create the HTML for the table row
            tr.innerHTML = `
                <td>#${ioc.id}</td>
                <td><strong>${ioc.actor_name || 'Unknown'}</strong></td>
                <td><code>${ioc.ioc_value}</code></td>
                <td>${ioc.ioc_type}</td>
                <td><span class="${badgeClass}">${ioc.severity}</span></td>
                <td>${ioc.description || '-'}</td>
                <td>
                    <button class="btn btn-edit" data-id="${ioc.id}" onclick='openEditModal(${JSON.stringify(ioc)})'>Edit</button>
                    <button class="btn btn-danger" onclick="deleteIOC(${ioc.id})">Delete</button>
                </td>
            `;
            // Append the fully constructed row to the table body
            ioCTableBody.appendChild(tr);
        });
    }

    // Handle filter form submission
    filterForm.addEventListener('submit', (e) => {
        // Prevent the page from refreshing when the form is submitted
        e.preventDefault();

        // Create a new FormData object from the filter form
        const formData = new FormData(filterForm);
        // Create a new URLSearchParams object to store the filter parameters
        const params = new URLSearchParams();

        // Loop through every input field in the form
        for (const [key, value] of formData) {
            // Only add parameters that have actual values (ignore empty dropdowns)
            if (value) params.append(key, value);
        }

        // Convert the params into a string format, prefixing with '?' if parameters exist
        // If no parameters exist, queryString will be an empty string
        const queryString = params.toString() ? `?${params.toString()}` : '';
        // Call fetchIOCs with the new query string
        fetchIOCs(queryString);
    });

    // Handle clear filters button click
    clearFiltersBtn.addEventListener('click', () => {
        // Reset all inputs in the form back to their default state
        filterForm.reset();
        // Fetch all IOCs without any filters
        fetchIOCs();
    });

    // Handle open Add Modal button click - clears form and sets title to "Add New IOC"
    addBtn.addEventListener('click', () => {
        // Clear any previous text or selections in the form immediately
        iocForm.reset();
        // Clear the hidden ID field
        document.getElementById('iocId').value = '';
        // Update the header text of the modal to indicate adding a new IOC
        modalTitle.textContent = 'Add New IOC';
        // Display the modal by adding the 'show' class
        modal.classList.add('show');
    });

    // Handle close Modal button click
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Hide the modal by removing the 'show' class
            modal.classList.remove('show');
        });
    });

    // Close Modal on outside click
    window.addEventListener('click', (e) => {
        // If the area clicked is exactly the modal background itself, hide it
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });

    // Expose openEditModal globally so it can be called from the inline onclick attribute in the HTML
    window.openEditModal = (ioc) => {
        // Populate the hidden ID field with the record's ID
        document.getElementById('iocId').value = ioc.id;
        // Pre-fill the Actor dropdown
        document.getElementById('actorId').value = ioc.actor_id;
        // Pre-fill the IOC Value input
        document.getElementById('iocValue').value = ioc.ioc_value;
        // Pre-fill the IOC Type dropdown
        document.getElementById('iocType').value = ioc.ioc_type;
        // Pre-fill the Severity dropdown
        document.getElementById('severity').value = ioc.severity;
        // Pre-fill the Description text area
        document.getElementById('description').value = ioc.description;

        // Change the title to indicate an edit action
        modalTitle.textContent = 'Edit IOC';
        // Show the modal
        modal.classList.add('show');
    };

    // Handle form submit (POST for adding, PUT for editing)
    iocForm.addEventListener('submit', async (e) => {
        // Prevent default form submission when the button is clicked
        e.preventDefault();

        // Get the ID from the hidden field
        const id = document.getElementById('iocId').value;

        // Extract all data from the form
        const formData = new FormData(iocForm);
        // Convert the FormData object into a JSON object
        const data = Object.fromEntries(formData.entries());

        // Determine the HTTP method based on whether an ID exists - PUT for editing, POST for adding
        const method = id ? 'PUT' : 'POST';
        // Determine the API endpoint based on whether an ID exists
        const url = id ? `${API_BASE}/iocs/${id}` : `${API_BASE}/iocs`;

        try {
            // Perform the fetch request
            const res = await fetch(url, {
                method: method,
                // Tell the backend we are sending JSON data
                headers: { 'Content-Type': 'application/json' },
                // Convert the JavaScript object back to JSON for the network payload
                body: JSON.stringify(data)
            });

            // If the server returns a 2XX success status code
            if (res.ok) {
                // Hide the modal from view
                modal.classList.remove('show');
                // Refresh the table to show the new or updated data
                fetchIOCs();
            } else {
                // Parse the error message sent from the Node backend
                const errorData = await res.json();
                // Show an alert to the user with the server's error message
                alert(`Error: ${errorData.error}`);
            }
        } catch (error) {
            // Log catastrophic failures (e.g. server down)
            console.error('Error saving IOC:', error);
        }
    });

    // Expose deleteIOC globally so it can be called from the inline onclick attribute in the HTML
    window.deleteIOC = async (id) => {
        // Ask the user to confirm via a browser alert box; if they cancel, exit early
        if (!confirm('Are you sure you want to delete this IOC?')) return;

        try {
            // Perform the DELETE request using the specific ID route 
            const res = await fetch(`${API_BASE}/iocs/${id}`, {
                method: 'DELETE'
            });

            // If successful
            if (res.ok) {
                // Refresh the list to remove the deleted item from view
                fetchIOCs();
            } else {
                // If it failed (e.g. not found), alert the user
                alert('Failed to delete IOC');
            }
        } catch (error) {
            // Log catastrophic errors
            console.error('Error deleting IOC:', error);
        }
    };

    // Add click event listener to the "+ Add Actor & IOC" button (transaction modal)
    if (addTransactionBtn) {
        addTransactionBtn.addEventListener('click', () => {
            // Reset the form to remove any remaining text
            transactionForm.reset();
            // Display the transaction modal overlay
            transactionModal.classList.add('show');
        });
    }

    // Add click event listener to the "Close Transaction Modal" button (transaction modal)
    if (closeTransactionBtns) {
        closeTransactionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Hide the transaction modal overlay
                transactionModal.classList.remove('show');
            });
        });
    }

    // Listen for outside click on transaction modal
    window.addEventListener('click', (e) => {
        if (transactionModal && e.target === transactionModal) {
            // Hide the transaction modal overlay
            transactionModal.classList.remove('show');
        }
    });

    // Listen for the form submission event on the new Transaction form
    if (transactionForm) {
        transactionForm.addEventListener('submit', async (e) => {
            // Prevent the default form submission when the button is clicked
            e.preventDefault();
            // Collect all user-typed input field values from the form
            const formData = new FormData(transactionForm);
            // Translate form values into a standard JavaScript object
            const data = Object.fromEntries(formData.entries());

            try {
                // Initiate a POST request to the backend server
                const res = await fetch(`${API_BASE}/actors-with-ioc`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    // Convert JS object into a JSON string
                    body: JSON.stringify(data)
                });

                // If the backend server responds with a 2xx success status code
                if (res.ok) {
                    // Remove the transaction modal from the user's view
                    transactionModal.classList.remove('show');
                    // Refresh the actors dropdown and the main IOCs table
                    await fetchActors();
                    fetchIOCs();
                    // otherwise handle the error
                } else {
                    const errorData = await res.json();
                    alert(`Error: ${errorData.error || 'Transaction failed'}`);
                }
            } catch (error) {
                console.error('Error saving transaction:', error);
            }
        });
    }

});
