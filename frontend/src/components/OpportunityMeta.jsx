import Icon from './Icon.jsx';
import { placeOf } from '../utils/format.js';

/** Organisation, location and role type, each with an icon instead of dot-separated text. */
export default function OpportunityMeta({ opportunity: o }) {
  const internship = o.type === 'internship';
  return (
    <ul className="meta">
      <li><Icon name="building" />{o.organisation}</li>
      <li><Icon name="pin" />{placeOf(o)}</li>
      <li><Icon name={internship ? 'cap' : 'job'} />{internship ? 'Internship' : 'Job'}</li>
      {o.location?.remote && <li><Icon name="globe" />Remote-friendly</li>}
    </ul>
  );
}
