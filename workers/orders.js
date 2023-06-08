const responseOptions = {
  headers: {
    "content-type": "text/html;charset=UTF-8"
  },
};

const sizeMap = {
  "extraextrasmallxxs": 'Extra Extra Small (XXS)',
  "extrasmallxs": 'Extra Small (XS)',
  "smalls": 'Small (S)',
  "mediumm": 'Medium (M)',
  "largel": 'Large (L)',
  "extralargexl": 'Extra Large (XL)',
  "extraextralargexxl": 'Extra Extra Large (XXL)',
}

async function fetchCheckouts(privateKey, starting_after = null) {
  const baseUrl = 'https://api.stripe.com/v1'
  let url = `${baseUrl}/checkout/sessions`

  let params = new URLSearchParams({
    limit: 100,
  })

  if (starting_after) {
    params.append('starting_after', starting_after)
  }

  url += '?' + params

  return await fetch(url, {
    headers: {
      'Authorization': `Bearer ${privateKey}`,
    }
  }).then(response => {
    if (response.ok) {
      return response.json()
    } else {
      throw response
    }
  })
  .then(async data => {
    let checkouts = data.data.filter(checkout => checkout.status === 'complete')

    if (data.has_more === true) {
      const starting_after = data.data[data.data.length - 1].id

      const moreCheckouts = await fetchCheckouts(privateKey, starting_after)

      checkouts.push(...moreCheckouts)
    }

    return checkouts
  })
}

const buildHtml = (content, title) => `<!doctype html>
<html lang="">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Schooltrui VSZ</title>
  <link rel="preconnect" href="https://cdn.jsdelivr.net">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css" integrity="sha256-rTpdO0HXBCNpreAHcu6tB2Ppg515Vo+5GtYSsnNLz+8=" crossorigin="anonymous">
  <link rel="stylesheet" href="https://schooltrui.nl/style.css">
</head>
<body>
  <main class="container section">
    <h1 class="title has-text-left is-1">Schooltrui VSZ</h1>
    <section class="box section">
      ${title ? `<h2 class="title">${title}</h2>` : ''}
      ${content}
    </section>
</body>
</html>
`

function buildTable(orders) {
  let pickUpRows = [];
  let sendRows = [];
  orders.forEach(order => {
    const address = `
        ${order.address.line1 ? order.address.line1 : ''}
        ${order.address.line2 ? order.address.line2 : ''}
        ${order.address.postal_code ? order.address.postal_code : ''} ${order.address.city ? order.address.city : ''}
        ${order.address.state ? order.address.state : ''}
        ${order.address.country ? order.address.country : ''}
      `

    if (order.shipping === false) {
      pickUpRows.push(`
          <tr>
            <td>${order.name}</td>
            <td>${order.email}</td>
            <td>${sizeMap[order.size]}</td>
          </tr>
        `)
    } else {
      sendRows.push(`
          <tr>
            <td>${order.name}</td>
            <td>${order.email}</td>
            <td>${sizeMap[order.size]}</td>
            <td>${address}</td>
          </tr>
        `)
    }
  })

  const pickupTable = `
  <h2 class="title">Ophalen <small>(${pickUpRows.length})</small></h2>
  <table class="table is-striped">
    <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Size</th>
    </tr>
    </thead>
    <tbody>${pickUpRows.join('\n')}</tbody>
  </table>
`
  const sendTable = `
  <h2 class="title">Verzenden <small>(${sendRows.length})</small></h2>
  <table class="table is-striped">
    <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Size</th>
      <th>Address</th>
    </tr>
    </thead>
    <tbody>${sendRows.join('\n')}</tbody>
  </table>
`

  return pickupTable + sendTable
}

export default {
  async fetch(request, env) {
    return fetchCheckouts(env.stripe_token).then(checkouts =>
      checkouts.map(checkout => ({
        address: checkout.customer_details.address,
        email: checkout.customer_details.email,
        name: checkout.customer_details.name,
        size: checkout.custom_fields[0].dropdown.value,
        shipping: (checkout.billing_address_collection === "required")
      })))
    .then(orders => orders.sort((a, b) => a.name.localeCompare(b.name)))
    .then(orders => {
      const table = buildTable(orders)

      const body = buildHtml(table)

      return new Response(body, responseOptions)
    })
    .catch(async (error) => {
      responseOptions.status = 500
      responseOptions.statusText = '"Oh, bother." said Pooh, "Something has gone wrong."'

      if (typeof error.json === 'undefined') {
        const body = buildHtml(`<pre>${error}</pre>`, 'Er ging iets mis!')
        return new Response(body, responseOptions)
      } else {
        let json = {}

        try {
          json = await error.json()
        } catch (e) {
          json = error
        }

        const body = buildHtml(`
          <p>Neem contact op met de ontwikkelaar van de website, vermeld daarbij onderstaande foutmelding:</p>
          <pre>${JSON.stringify(json, null, 4)}</pre>
        `, 'Er ging iets mis!');

          (['status', 'statusText', 'headers']).forEach(key => {
          let value = error[key];

          if (value !== undefined) {
            if (key === 'headers') {
              value = {}
              error.headers.forEach((headerValue, headerKey) => {
                value[headerKey] = headerValue
              })
            }
            responseOptions[key] = value
          }
        })
        return new Response(body, responseOptions)
      }
    })
  }
}
