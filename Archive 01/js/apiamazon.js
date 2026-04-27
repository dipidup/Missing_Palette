import AmazonPaapi from "amazon-paapi";

export default async function handler(req, res) {
  const { asin } = req.query;

  if (!asin)
    return res.status(400).json({ error: "ASIN required ?asin=XXXX" });

  try {
    const commonParameters = {
      AccessKey: process.env.AMAZON_ACCESS_KEY,
      SecretKey: process.env.AMAZON_SECRET_KEY,
      PartnerTag: process.env.AMAZON_ASSOC_TAG,
      PartnerType: "Associates",
      Marketplace: "www.amazon.in"
    };

    const requestParameters = {
      ASIN: asin,
      Resources: [
        "Images.Primary.Large",
        "ItemInfo.Title",
        "Offers.Listings.Price"
      ]
    };

    const response = await AmazonPaapi.GetItems(commonParameters, requestParameters);

    const item = response.ItemsResult.Items[0];

    return res.json({
      title: item.ItemInfo.Title.DisplayValue,
      image: item.Images.Primary.Large.URL,
      price: item.Offers.Listings[0].Price.DisplayAmount,
      url: item.DetailPageURL
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
