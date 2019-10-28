Facebook Omni Channel By Oneshop
---------------
## Introduction

This is one of the most popular omni-channel on Oneshop, users are able to publish their contents to their Facebook page by connecting their shop to their Facebook page.  
We open sourced this repository for anyone who wants to create their own platform.  
You can connect any platform you want unless the platform has relative APIs.  

## Oneshop Panel
You can manage your content and products via the [Oneshop Panel](https://panel.oneshop.cloud).  

## API
Besides the panel, you have the full previllege of your platform and manage it by the OS-API.  
OS-API Reference: [https://docs.oneshop.dev](https://docs.oneshop.dev)  

## Create your own platform?
1. Get your API Key at [Oneshop Panel](https://panel.oneshop.cloud) **(Available soon)**  
2. or contact us at [hello@oneshop.team](mailto:hello.oneshop.team)  

## We need you!
We are continously looking for someone to contribute and make the eco-system of ecommerce better!  

## Routes
### Connect your shop
`GET https://fb.oneshop.hk/auth/facebook?shops=SHOP_ID`  
Authorize Oneshop App to manage and publish your Facebook Pages.  

### Select page to connect
`GET https://fb.oneshop.hk/pages`  
Request query: access_token (Your token for accessing your shop)  
Select pages that you want to manage by your Oneshop.  

### Retrieve articles
`GET https://fb.oneshop.hk/articles/:article_id`  
View article by id.  

### Publish content to page
`POST https://fb/oneshop.hk/release`  
Request body: feed (Feed ID)  
Publish article to corresponding shop.  