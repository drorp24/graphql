import Merchant from '../models/merchant'

export default async function test() {
  /*
  let ami = await Merchant.byName({ name: 'ami', results: 1 })
  ami = ami.pop()

  ami
    .updateQuotation({ currency: 'USD', buy: 0.5 })
    .then(res => console.log('\n ami.updateQuotations returned: \n', res))
    .catch(e => console.log('updateQuotation error: ', e))
  */
  /*
  console.log('\n', cashCash, '\n')
  console.log('\n', cashCash.delivers, '\n')
  console.log('\n cashCash.quotation(USD) \n', cashCash.quotation('USD'), '\n')
  console.log(
    '\n cashCash.quotation(USD) \n',
    await cashCash.quotation('USD').catch(e => console.log(e)),
    '\n',
  )
  console.log(
    '\n cashCash.quotation(ABC) \n',
    cashCash.quotation('ABC').catch(e => console.log(e)),
    '\n',
  )
  */
  /*
  console.log('\ndelivery merchants:\n', await Merchant.deliver())
  console.log(
    '\ncharging delivery merchants:\n',
    await Merchant.deliver().charging(),
  )


  const searchCriteria = {
    lng: 34.7768717,
    lat: 32.0578385,
    distance: 20,
    currency: 'CHF',
    delivery
    results: 1,
  }
  console.log('\n Merchant.search results: \n')
  console.log(searchCriteria)
  console.log(' ')
  console.log(
    await Merchant.search(searchCriteria).catch(err =>
      console.log('Merchant.search error: ', err),
    ),
  )
  */
  /*
console.log(
    '\nMerchant.selling(CHF)\n',
    await Merchant.find()
      .selling('CHF')
      .limit(2)
      .catch(err => console.log(err)),
  )
*/
  /*
  console.log(
    '\n By name: \n',
    await Merchant.byName({ name: 'ami', results: 2 }).catch(err =>
      console.log('Merchant.byName error: ', err),
    ),
  )
  */
}
