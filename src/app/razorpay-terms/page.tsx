
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RazorpayTermsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/checkout" className="inline-block">
        <Button variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Checkout
        </Button>
      </Link>
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Razorpay Terms and Conditions</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm md:prose-base dark:prose-invert max-w-none space-y-4">
          <h2 className="text-2xl font-semibold">PART A: GENERAL TERMS AND CONDITIONS</h2>
          <p>This document/agreement/understanding is a computer-generated electronic record published in terms of Rule 3 of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 (amended from time to time) read with Information Technology Act, 2000 (amended from time to time) and does not require any physical or digital signatures.</p>
          <p>These Terms and Conditions (“Terms”) constitute a legal agreement between You and Razorpay Software Private Limited (“Razorpay” or “us”, or “we” or “our””). The Terms, constituted of Part A: General Terms and Conditions and Part B: Specific Terms and Conditions, govern Your access to and use of Razorpay services, including payments, technology, software, analytics or any other services, tools or products offered or made available by Razorpay and/or its Affiliates, and/or their Facility Providers, (“Services”). The Services may be offered or made available to You via our website, mobile applications, software, APIs, social media, or other access channels (“Platform”). “You”, “Yours”, “Yourself” or “Merchant” refers to customers, who may be a non-registered individual or corporate body, who register for, use, or access the Platform or Services. The Services provided by Razorpay through the Platform are available and are appropriate only for use in India.</p>
          <p>Please read these Terms carefully before accessing the Platform or using the Services. By accessing the Platform or using the Services, You agree to be bound by these Terms, including our Privacy Policy and any other policy applicable to the Services received via the Platform. If You do not agree to these Terms or do not wish to be bound by these Terms, You must immediately terminate the use of the Services. Razorpay reserves the right to amend or otherwise modify the Terms at any time by posting an updated version on the website. The updated Terms shall take effect immediately upon posting. It is Your responsibility to review these Terms periodically for updates/amendments. Your continued access of the Platform or use of the Services signifies Your assent/ratification of the updated or modified Terms. If You object to these Terms or any subsequent modifications to these Terms in any way, Your only recourse is to immediately terminate the use of the Services.</p>

          <h3 className="text-xl font-semibold">1. PROPRIETARY RIGHTS</h3>
          <p><strong>1.1.</strong> We (and our licensors, as applicable) remain the sole owner of all right, title and interest in the Services, including the Platform and the website www.razorpay.com (“website”), including any intellectual property rights which subsist in the Services (whether registered or not). Razorpay grants You a personal, non-exclusive, non-transferable, limited right to access the Platform and make personal use of the website and the Services. You shall not remove, obscure, or alter any proprietary rights notices (including trademark and copyright notices), which may be affixed to or contained within the Services. We reserve all rights not granted under the Terms. We (and our licensors, as applicable) retains its rights in and to trademarks, trade names, service marks, logos, domain names, and other distinctive brand features (“marks”) owned or used by us in the course of our business. You do not have the right to use any of our marks without explicit consent from us. You shall not download, copy, create a derivative work, modify, reverse engineer, reverse assemble, transmit or otherwise attempt to discover any source code, sell, assign, sub-license, grant a security interest in or otherwise transfer any right in the Services or marks. You further acknowledge and agree that the Services may contain information that is designated confidential by us and You shall not disclose such information without our prior written consent.</p>
          <p><strong>1.2.</strong> You grant a royalty-free, non-exclusive, irrevocable, transferable and sub-licensable license to Razorpay, its Affiliates and third party service providers, to use Your data, Your customer’s data, information, content, trademarks, logos and any other materials/information You upload or make available to us or on the Platform (“Your materials”). You agree that Razorpay may use Your materials to operate and improve the Platform, provide the Services, and fulfil Razorpay’s rights and discharge its obligations under the Terms. You agree that Razorpay may use Your materials in its marketing and promotional materials without requiring any incremental consent from You. You further agree that Razorpay may conduct analytics on Your materials and that Razorpay shall retain ownership of the results or reports derived from such data which shall be in aggregated and anonymised form for its business purposes in accordance with Applicable Laws. You shall indemnify and hold harmless Razorpay, its Affiliates and its service providers on demand against all claims and losses arising out of or in connection with our use of Your Materials in accordance with this clause.</p>

          <h3 className="text-xl font-semibold">2. USAGE OF THE WEBSITE AND USE OF SERVICES BY THE USER</h3>
          <p><strong>2.1.</strong> You shall register to become a user of the Website only if You are of the age of 18 or above and can enter into binding contracts as per Applicable Laws. You are responsible for maintaining the secrecy of Your passwords, login and account information. You are responsible for maintaining the confidentiality of any login information and secure access credentials associated with Your Razorpay account. You will be responsible for all use of the Platform and/ or Services by You or anyone using Your password and login information (with or without our permission). You are responsible for all activities that occur under Your account/in using Your secure credentials and Razorpay shall not be liable for any such change or action performed by using Your secure credentials on the Website.</p>

          <h3 className="text-xl font-semibold">3. PAYMENT</h3>
          <p><strong>3.1.</strong> Applicable fees for the provision of Services shall be levied by Razorpay from time to time. You agree that the fees shall be charged according to the manner, rates and frequency determined by Razorpay. Razorpay reserves the right to update the amount of the fees charged at its sole discretion. Razorpay fees allow access to the entire suite of payments products, dashboard and custom reports, and includes MDR charges, if any, for payment instruments as prescribed under applicable guidelines. For clarity, Razorpay fees include zero MDR for Rupay Debit Cards and UPI transactions.</p>

          <h3 className="text-xl font-semibold">4. PRIVACY POLICY</h3>
          <p>By using the website, You hereby consent to the use of Your information as we have outlined in our Privacy Policy.</p>

          <h3 className="text-xl font-semibold">5. THIRD PARTY LINKS / OFFERS</h3>
          <p>The Platform contains links to other websites over which we have no control. We encourage You to review the terms and privacy policies of those other websites so You can understand Your use of the websites and how they collect, use and share Your information. Razorpay is not responsible for the terms and conditions, privacy policies or practices of other websites to which You choose to link from the Platform. You further acknowledge and agree that Razorpay shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with use of or reliance on any such content, goods or services available on or through any such site or resource. Your interaction with any third party accessed through the website is at Your own risk, and Razorpay will have no liability with respect to the acts, omissions, errors, representations, warranties, breaches or negligence of any such third parties or for any personal injuries, death, property damage, or other damages or expenses resulting from Your interactions with the third parties.</p>

          <h3 className="text-xl font-semibold">6. OUR PARTNERS</h3>
          <p>This Platform also offers You access to information primarily about certain financial products/services including, but not restricted, to loan facility, credit cards facility, investment services such as current accounts offered by our lending partners. The terms and conditions for the same can be accessed here.</p>

          <h3 className="text-xl font-semibold">7. DISCLAIMER OF WARRANTY</h3>
          <p>To the maximum extent permitted by Applicable Laws, the Platform and the Services are provided on an “as is” basis. You acknowledge that Razorpay does not warrant that the Service(s) will be uninterrupted or error free or fit for Your specific business purposes.</p>

          <h3 className="text-xl font-semibold">8. LIMITATION OF LIABILITY</h3>
          <p><strong>8.1.</strong> Razorpay (including its officers, directors, employees, representatives, affiliates, and providers) will not be responsible or liable for (a) any injury, death, loss, claim, act of God, accident, delay, or any direct, special, exemplary, punitive, indirect, incidental or consequential damages of any kind (including without limitation lost profits or lost savings), whether based in contract, tort, strict liability or otherwise, that arise out of or is in any way connected with (i) any failure or delay (including without limitation the use of or inability to use any component of the Platform), or (ii) any use of the Platform or Services or content therein, or (iii) the performance or non-performance by us or any Facility Provider, even if we have been advised of the possibility of damages to such parties or any other party, or (iv) any damages to or viruses that may infect Your computer equipment or other property as the result of Your access to the Platform or Services or Your use of any content therein.</p>
          <p><strong>8.2.</strong> Notwithstanding anything under these Terms, Razorpay's aggregate liability and that of its affiliates, officers, employees and agents relating to the Service(s), will not exceed an amount equal to one (1) month fees paid by You for the specific Service(s) giving rise to the liability. Razorpay's liability under or in connection with Terms will be proportionately reduced to the extent any loss or damage is contributed to by You or Your third party providers.</p>

          <h3 className="text-xl font-semibold">9. INDEMNITY</h3>
          <p>You agree to indemnify and hold Razorpay (and its officers, affiliates, group company, directors, agents and employees) harmless from any and against all claims, whether or not brought by third parties, causes of action, demands, recoveries, losses, damages, fines, penalties or other costs or expenses of any kind or nature, including reasonable attorneys' fees, or arising out of or related to Your breach of these Terms, Your violation of any Applicable Laws or the rights of a third party, or Your use of the Platform or any disputes between You and any third party. The covenants of indemnity set forth herein shall survive and continue even after the termination of Your use of the Services.</p>

          <h3 className="text-xl font-semibold">10. CARD ASSOCIATION RULES</h3>
          <p><strong>10.1.</strong> "Card Payment Network Rules" refer to the written rules, regulations, releases, guidelines, processes, interpretations and other requirements (whether contractual or otherwise) imposed and adopted by the card payment networks. These card payment networks have infrastructure and processes to enable transaction authorisation. The card payment networks require You to comply with all applicable guidelines, rules, and regulations formulated by them.</p>

          <h3 className="text-xl font-semibold">17. PROHIBITED PRODUCTS AND SERVICES</h3>
          <ol>
            <li>Adult goods and services which includes pornography and other sexually suggestive materials (including literature, imagery and other media); escort or prostitution services; website access and/or website memberships of pornography or illegal sites;</li>
            <li>Alcohol which includes alcohol or alcoholic beverages such as beer, liquor, wine, or champagne;</li>
            <li>Body parts which includes organs or other body parts;</li>
            <li>Bulk marketing tools which includes email lists, software, or other products enabling unsolicited email messages (spam);</li>
            <li>Cable descramblers and black boxes which includes devices intended to obtain cable and satellite signals for free;</li>
            <li>Child pornography which includes pornographic materials involving minors;</li>
            <li>Copyright unlocking devices which includes mod chips or other devices designed to circumvent copyright protection;</li>
            <li>Copyrighted media which includes unauthorized copies of books, music, movies, and other licensed or protected materials;</li>
            <li>Copyrighted software which includes unauthorized copies of software, video games and other licensed or protected materials, including OEM or bundled software;</li>
            <li>Counterfeit and unauthorized goods which includes replicas or imitations of designer goods; items without a celebrity endorsement that would normally require such an association; fake autographs, counterfeit stamps, and other potentially unauthorized goods;</li>
            <li>Drugs and drug paraphernalia which includes illegal drugs and drug accessories, including herbal drugs like salvia and magic mushrooms;</li>
            <li>Drug test circumvention aids which includes drug cleansing shakes, urine test additives, and related items;</li>
            <li>Endangered species which includes plants, animals or other organisms (including product derivatives) in danger of extinction;</li>
            <li>Gaming/gambling which includes lottery tickets, sports bets, memberships/ enrolment in online gambling sites, and related content;</li>
            <li>Government IDs or documents which includes fake IDs, passports, diplomas, and noble titles;</li>
            <li>Hacking and cracking materials which includes manuals, how-to guides, information, or equipment enabling illegal access to software, servers, website, or other protected property;</li>
            <li>Illegal goods which includes materials, products, or information promoting illegal goods or enabling illegal acts;</li>
          </ol>

          <h2 className="text-2xl font-semibold">PART B: SPECIFIC TERMS AND CONDITIONS</h2>
          <h3 className="text-xl font-semibold">PART I - SPECIFIC TERMS FOR ONLINE PAYMENT AGGREGATION SERVICES</h3>
          <h4>1. PAYMENT PROCESSING</h4>
          <p><strong>1.1.</strong> Subject to Part A: General Terms and Conditions in conjunction with Part I: Specific Terms for Online Payment Aggregation Services, Razorpay shall facilitate collection of online payments for products/services sold by You. You agree that where any settlement amount is less than Rupee 1, Razorpay shall endeavour to, but is not obligated to You, make such settlement.</p>
          <h4>2. CHARGEBACKS</h4>
          <p><strong>2.1.</strong> If a Facility Provider communicates to Razorpay the receipt of a Chargeback Request, You will be notified of the Chargeback. You agree that liability for Chargeback, whether domestic or international, under the Terms solely rests with You. You further agree that it is Your sole discretion whether to avail non-3D secure services or not and additional terms for the same will apply as set out in the Merchant dashboard. Subject to availability of funds, Razorpay upon receipt of a Chargeback Request shall forthwith deduct Chargeback Amount from the Transaction Amounts, which may be used, based on the decision of the Facility Provider, either to a) process Chargeback in favour of the customer or b) credit to You. For the avoidance of doubt, Razorpay shall be entitled to deduct the Chargeback Amount upon receiving a Chargeback claim. You shall be entitled to furnish to Razorpay documents and information (“Chargeback Documents”) pertaining to the Transaction associated with the Chargeback Request in order to substantiate (i) the completion of the aforesaid Transaction; and /or; (ii) delivery of goods/services sought by the customer pursuant to the said Transaction. You shall furnish the Chargeback Documents within three (3) calendar days (or such other period specified by the Facility Provider) of receiving notification of the Chargeback Request.</p>
          <h4>3. REFUNDS</h4>
          <p><strong>3.1.</strong> You agree and acknowledge that subject to availability of funds received in the Escrow Account, You are entitled to effect Refunds at Your sole discretion.</p>
          <h4>4. FRAUDULENT TRANSACTIONS</h4>
          <p><strong>4.1.</strong> Subject to clause 2.1 and 2.2 of this Part I: Specific Terms for Online Payment Aggregation Services, if Razorpay is intimated, by a Facility Provider, that a customer has reported an unauthorised debit of the customer's Payment Instrument (“Fraudulent Transaction”), then in addition to its rights under clause 16 of Part A: General Terms and Conditions, Razorpay shall be entitled to suspend settlements to You during the pendency of inquiries, investigations and resolution thereof by the Facility Providers.</p>
        </CardContent>
      </Card>
    </div>
  );
}
