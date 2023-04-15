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
    let checkouts = data.data.filter(checkout => checkout.status === 'complete');

    if (data.has_more === true) {
      const starting_after = data.data[data.data.length - 1].id;

      const moreCheckouts = await fetchCheckouts(privateKey, starting_after)

      checkouts.push(...moreCheckouts)
    }

    return checkouts
  })
}

const sizeMap = {
  "extraextrasmallxxs": 'Extra Extra Small (XXS)',
  "extrasmallxs": 'Extra Small (XS)',
  "smalls": 'Small (S)',
  "mediumm": 'Medium (M)',
  "largel": 'Large (L)',
  "extralargexl": 'Extra Large (XL)',
  "extraextralargexxl": 'Extra Extra Large (XXL)',
}

const sizes = {
  "extraextrasmallxxs": 0,
  "extrasmallxs": 0,
  "smalls": 0,
  "mediumm": 0,
  "largel": 0,
  "extralargexl": 0,
  "extraextralargexxl": 0,
}

export default {
  async fetch(request, env) {

    let body = ''
    const options = {}

    options.headers = {"content-type": "text/html;charset=UTF-8"}

    return fetchCheckouts(env.stripe_token).then(checkouts =>
      checkouts.map(checkout => ({
        size: checkout.custom_fields[0].dropdown.value,
      }))
    ).then(orders => {
      orders.forEach(order => {
        sizes[order.size]++
      })

      body += `<!doctype html>
<html lang="">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Schooltrui VSZ</title>

  <link rel="preconnect" href="https://cdn.jsdelivr.net">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css"
    integrity="sha256-rTpdO0HXBCNpreAHcu6tB2Ppg515Vo+5GtYSsnNLz+8=" crossorigin="anonymous">
  <link rel="stylesheet" href="https://schooltrui.nl/style.css">
</head>
<body>
  <main class="container section">
    <h1 class="title has-text-left is-1">Schooltrui VSZ</h1>
    <section class="box section">
      <h2 class="title">Bestellingen</h2>
      <table class="table is-striped">
        <thead>
        <tr>
          <th>Maat</th>
          <th>Hoeveelheid</th>
        </tr>
        </thead>
        <tfoot>
        <tr>
          <td><strong>Totaal</strong></td>
          <td><strong>${orders.length}</strong></td>
        </tr>
        </tfoot>
        <tbody>
`
      Object.entries(sizes).forEach(([size, amount]) => {
        body += `
                  <tr>
                    <td>${sizeMap[size]}</td>
                    <td>${amount}</td>
                  </tr>
                `
      })
      body += `
          </tbody>
        </table>
    </section>
</body>
</html>`
      return new Response(body, options)
    }).catch(async (error) => {
      if (typeof error.json === 'undefined') {
        return new Response(error, {
          status: 500
        })
      } else {
        let json = {}

        try {
          json = await error.json()
          json.url = url
        } catch (e) {
          json = error
        }

        return new Response(JSON.stringify(json, null, 4), {
          headers: error.headers || {},
          status: error.status || 500,
          statusText: error.statusText || 'Oh, bother.'
        })
      }
    })
  }
}
