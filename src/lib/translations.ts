import en from '../localisation/en.json';
import nl from '../localisation/nl.json';
import de from '../localisation/de.json';
import fr from '../localisation/fr.json';
import es from '../localisation/es.json';
import it from '../localisation/it.json';
import pt from '../localisation/pt.json';
import ptBr from '../localisation/ptBr.json';
import ru from '../localisation/ru.json';
import zhCn from '../localisation/zhCn.json';
import zhTw from '../localisation/zhTw.json';
import ja from '../localisation/ja.json';
import ko from '../localisation/ko.json';
import pl from '../localisation/pl.json';
import tr from '../localisation/tr.json';
import th from '../localisation/th.json';
import sv from '../localisation/sv.json';
import no from '../localisation/no.json';
import da from '../localisation/da.json';
import fi from '../localisation/fi.json';
import hu from '../localisation/hu.json';
import cs from '../localisation/cs.json';
import ro from '../localisation/ro.json';
import bg from '../localisation/bg.json';
import el from '../localisation/el.json';
import uk from '../localisation/uk.json';
import vi from '../localisation/vi.json';
import id from '../localisation/id.json';
import ar from '../localisation/ar.json';
import esLatam from '../localisation/esLatam.json';

const languages = {
  en,
  nl,
  de,
  fr,
  es,
  it,
  pt,
  ptBr,
  ru,
  zhCn,
  zhTw,
  ja,
  ko,
  pl,
  tr,
  th,
  sv,
  no,
  da,
  fi,
  hu,
  cs,
  ro,
  bg,
  el,
  uk,
  vi,
  id,
  ar,
  esLatam,
  // Steam locale aliases
  schinese: zhCn,
  tchinese: zhTw,
  brazilian: ptBr,
  koreana: ko,
  latam: esLatam,
  norwegian: no,
} as const;

export default languages;
